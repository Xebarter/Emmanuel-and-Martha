import { Gift, Search, Loader2, Package, DollarSign, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { normalizePhone, formatCurrency, formatDate } from '../lib/utils';
import { initiatePesapalPayment } from '../services/paymentService';

const pledgeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  type: z.enum(['money', 'item']),
  amount: z.number().optional(),
  item_description: z.string().optional(),
  quantity: z.number().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    if (data.type === 'money') return data.amount && data.amount > 0;
    if (data.type === 'item') return data.item_description && data.item_description.length > 0;
    return false;
  },
  {
    message: 'Please provide either an amount (for money) or item description (for items)',
  }
);

type PledgeForm = z.infer<typeof pledgeSchema>;

interface Pledge {
  id: string;
  guest_id: string | null;
  type: 'money' | 'item';
  item_description: string | null;
  amount: number | null;
  quantity: number | null;
  status: 'pending' | 'fulfilled' | 'cancelled';
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string;
  fulfilled_at: string | null;
  fulfilled_amount: number | null;
  guest?: {
    full_name: string;
  } | null;
}

interface PledgeSectionProps {
  totalPledges: number;
}

export function PledgeSection({ totalPledges }: PledgeSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [trackPhone, setTrackPhone] = useState('');
  const [trackedPledges, setTrackedPledges] = useState<Pledge[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [fulfillingPledge, setFulfillingPledge] = useState<string | null>(null);
  const [fulfillAmount, setFulfillAmount] = useState<number | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PledgeForm>({
    resolver: zodResolver(pledgeSchema),
    defaultValues: {
      type: 'money',
    },
  });

  const pledgeType = watch('type');

  // Calculate total fulfilled amount for a pledge
  const calculateFulfilledAmount = (pledgeId: string) => {
    // In a real implementation, this would query fulfilled contributions linked to this pledge
    // For now, we'll return 0 as a placeholder
    return 0;
  };

  // Calculate remaining balance for a pledge
  const calculateRemainingBalance = (pledge: Pledge) => {
    if (pledge.type !== 'money' || !pledge.amount) return 0;
    const fulfilledAmount = pledge.fulfilled_amount || 0;
    return Math.max(0, (pledge.amount || 0) - fulfilledAmount);
  };

  const onSubmit = async (data: PledgeForm) => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const normalizedPhone = normalizePhone(data.phone);

      let guestId = null;
      const { data: existingGuest } = await supabase
        .from('guests')
        .select('id')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (existingGuest) {
        guestId = existingGuest.id;
      } else {
        const { data: newGuest, error: guestError } = await supabase
          .from('guests')
          .insert({
            full_name: data.name,
            phone: normalizedPhone,
            email: null,
          })
          .select('id')
          .single();

        if (guestError) throw guestError;
        guestId = newGuest.id;
      }

      const { error: pledgeError } = await supabase
        .from('pledges')
        .insert({
          guest_id: guestId,
          type: data.type,
          amount: data.type === 'money' ? data.amount : null,
          item_description: data.type === 'item' ? data.item_description : null,
          quantity: data.type === 'item' ? data.quantity || 1 : null,
          phone: normalizedPhone,
          notes: data.notes || null,
          status: 'pending',
        });

      if (pledgeError) throw pledgeError;

      setSubmitMessage({
        type: 'success',
        text: 'Thank you! Your pledge has been recorded. We will contact you closer to the wedding date.',
      });
      reset({ type: 'money' });
    } catch (error) {
      console.error('Pledge error:', error);
      setSubmitMessage({
        type: 'error',
        text: 'Failed to record pledge. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackPledges = async () => {
    if (!trackPhone) return;

    setIsTracking(true);
    try {
      const normalizedPhone = normalizePhone(trackPhone);
      const { data, error } = await supabase
        .from('pledges')
        .select(`
          *,
          guest:guests(full_name)
        `)
        .eq('phone', normalizedPhone)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrackedPledges(data || []);
    } catch (error) {
      console.error('Track pledges error:', error);
      setTrackedPledges([]);
    } finally {
      setIsTracking(false);
    }
  };

  const handleFulfillPledge = async (pledge: Pledge) => {
    if (!pledge.amount) return;
    
    setFulfillingPledge(pledge.id);
    setPaymentError(null);
    
    try {
      const remainingBalance = calculateRemainingBalance(pledge);
      const amountToPay = fulfillAmount && fulfillAmount <= remainingBalance ? fulfillAmount : remainingBalance;
      
      // Validate amount
      if (amountToPay <= 0) {
        throw new Error('Invalid amount');
      }
      
      // Create a contribution record for this pledge fulfillment
      const { data: contributionData, error: contributionError } = await supabase
        .from('contributions')
        .insert({
          amount: amountToPay,
          currency: 'UGX',
          status: 'pending',
          metadata: {
            pledge_id: pledge.id,
            fulfillment: true
          }
        })
        .select()
        .single();

      if (contributionError) throw contributionError;

      // Update the pledge with the fulfilled amount
      const newFulfilledAmount = (pledge.fulfilled_amount || 0) + amountToPay;
      const newStatus = newFulfilledAmount >= (pledge.amount || 0) ? 'fulfilled' : 'pending';
      const fulfilledAt = newStatus === 'fulfilled' ? new Date().toISOString() : pledge.fulfilled_at;

      const { error: pledgeUpdateError } = await supabase
        .from('pledges')
        .update({
          fulfilled_amount: newFulfilledAmount,
          status: newStatus,
          fulfilled_at: fulfilledAt,
          updated_at: new Date()
        })
        .eq('id', pledge.id);

      if (pledgeUpdateError) throw pledgeUpdateError;

      // Initiate payment
      setIsProcessingPayment(true);
      const result = await initiatePesapalPayment(
        contributionData.id,
        amountToPay,
        'UGX',
        pledge.guest?.full_name || 'Anonymous',
        pledge.email || '',
        pledge.phone,
        `Fulfillment for pledge: ${pledge.type === 'money' ? formatCurrency(pledge.amount) : pledge.item_description}`
      );

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.redirectUrl) {
        // Redirect to payment page
        window.location.href = result.redirectUrl;
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      setPaymentError(error instanceof Error ? error.message : 'Failed to initiate payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <section id="pledge" className="py-12 md:py-20 bg-gradient-to-br from-amber-50 via-white to-rose-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-3 sm:mb-4">
            Make a Pledge
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Promise to contribute money or items for our special day
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-5 sm:p-6 md:p-8 border border-gray-100">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Create Your Pledge</h3>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4 sm:mb-6">
                <label htmlFor="name" className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name')}
                  type="text"
                  id="name"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div className="mb-4 sm:mb-6">
                <label htmlFor="phone" className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  id="phone"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                  placeholder="+256700000000"
                />
                {errors.phone && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.phone.message}</p>}
              </div>

              <div className="mb-4 sm:mb-6">
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                  Pledge Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <label className="flex items-center justify-center p-2 sm:p-3 md:p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-amber-500">
                    <input
                      {...register('type')}
                      type="radio"
                      value="money"
                      className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5"
                    />
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-amber-600" />
                    <span className="text-sm sm:text-base font-medium">Money</span>
                  </label>
                  <label className="flex items-center justify-center p-2 sm:p-3 md:p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-amber-500">
                    <input
                      {...register('type')}
                      type="radio"
                      value="item"
                      className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5"
                    />
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-amber-600" />
                    <span className="text-sm sm:text-base font-medium">Item</span>
                  </label>
                </div>
              </div>

              {pledgeType === 'money' && (
                <div className="mb-4 sm:mb-6">
                  <label htmlFor="amount" className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                    Pledge Amount (UGX) <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('amount', { valueAsNumber: true })}
                    type="number"
                    id="amount"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                    placeholder="50000"
                    step="1000"
                    min="0"
                  />
                </div>
              )}

              {pledgeType === 'item' && (
                <>
                  <div className="mb-4 sm:mb-6">
                    <label htmlFor="item_description" className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                      Item Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('item_description')}
                      type="text"
                      id="item_description"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                      placeholder="e.g., 10 plastic chairs"
                    />
                  </div>
                  <div className="mb-4 sm:mb-6">
                    <label htmlFor="quantity" className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                      Quantity
                    </label>
                    <input
                      {...register('quantity', { valueAsNumber: true })}
                      type="number"
                      id="quantity"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                      placeholder="1"
                      min="1"
                    />
                  </div>
                </>
              )}

              <div className="mb-4 sm:mb-6">
                <label htmlFor="notes" className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  {...register('notes')}
                  id="notes"
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                  placeholder="Any additional information..."
                />
              </div>

              {submitMessage && (
                <div
                  className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
                    submitMessage.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {submitMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 rounded-lg font-semibold hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    Submit Pledge
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-5 sm:p-6 md:p-8 border border-gray-100">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Track Your Pledges</h3>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              Enter your phone number to view all pledges you've made
            </p>

            <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-6">
              <input
                type="tel"
                value={trackPhone}
                onChange={(e) => setTrackPhone(e.target.value)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base"
                placeholder="+256700000000"
              />
              <button
                onClick={handleTrackPledges}
                disabled={isTracking || !trackPhone}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isTracking ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <Search className="w-5 h-5 mx-auto" />}
                <span className="sm:hidden">Search</span>
              </button>
            </div>

            {trackedPledges.length > 0 ? (
              <div className="space-y-4">
                {trackedPledges.map((pledge) => {
                  const remainingBalance = calculateRemainingBalance(pledge);
                  const hasBalance = remainingBalance > 0 && pledge.type === 'money';
                  
                  return (
                    <div key={pledge.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {pledge.type === 'money' ? (
                            <DollarSign className="w-5 h-5 text-amber-600" />
                          ) : (
                            <Package className="w-5 h-5 text-amber-600" />
                          )}
                          <span className="font-semibold text-gray-900 text-sm sm:text-base">
                            {pledge.type === 'money'
                              ? formatCurrency(pledge.amount || 0)
                              : pledge.item_description}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium ${
                            pledge.status === 'fulfilled'
                              ? 'bg-green-100 text-green-800'
                              : pledge.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {pledge.status}
                        </span>
                      </div>
                      
                      {pledge.quantity && (
                        <p className="text-sm text-gray-600 mb-1">Quantity: {pledge.quantity}</p>
                      )}
                      {pledge.notes && (
                        <p className="text-sm text-gray-600 mb-2">{pledge.notes}</p>
                      )}
                      
                      {hasBalance && (
                        <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
                          <p className="text-sm text-amber-800">
                            Remaining balance: <strong>{formatCurrency(remainingBalance)}</strong>
                          </p>
                          {pledge.fulfilled_amount && pledge.fulfilled_amount > 0 && (
                            <p className="text-xs text-amber-700 mt-1">
                              Already paid: {formatCurrency(pledge.fulfilled_amount)}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {pledge.fulfilled_amount && pledge.fulfilled_amount > 0 && !hasBalance && (
                        <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                          <p className="text-sm text-green-800">
                            Fully paid! Thank you for your contribution.
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            Total paid: {formatCurrency(pledge.fulfilled_amount)}
                          </p>
                        </div>
                      )}
                      
                      {!pledge.fulfilled_amount && (
                        <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                          <p className="text-sm text-gray-600">
                            Not yet fulfilled
                          </p>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-2">Pledged on {formatDate(pledge.created_at)}</p>
                      {pledge.fulfilled_at && (
                        <p className="text-xs text-green-600 mt-1">Fulfilled on {formatDate(pledge.fulfilled_at)}</p>
                      )}
                      
                      {hasBalance && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          {fulfillingPledge === pledge.id ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Amount to pay ({formatCurrency(remainingBalance)} available)
                                </label>
                                <input
                                  type="number"
                                  min="1000"
                                  max={remainingBalance}
                                  step="1000"
                                  value={fulfillAmount || ''}
                                  onChange={(e) => {
                                    const value = Number(e.target.value);
                                    if (!isNaN(value) && value >= 0 && value <= remainingBalance) {
                                      setFulfillAmount(value || null);
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                  placeholder="Enter amount"
                                />
                                {fulfillAmount && (fulfillAmount < 1000 || fulfillAmount > remainingBalance) && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {fulfillAmount < 1000 
                                      ? 'Minimum amount is UGX 1,000' 
                                      : `Maximum amount is ${formatCurrency(remainingBalance)}`}
                                  </p>
                                )}
                              </div>
                              
                              {paymentError && (
                                <div className="text-red-600 text-sm">{paymentError}</div>
                              )}
                              
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                  onClick={() => handleFulfillPledge(pledge)}
                                  disabled={isProcessingPayment || !fulfillAmount || fulfillAmount > remainingBalance || fulfillAmount < 1000}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                  {isProcessingPayment ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <CreditCard className="w-4 h-4" />
                                      Pay Now
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setFulfillingPledge(null);
                                    setFulfillAmount(null);
                                    setPaymentError(null);
                                  }}
                                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setFulfillingPledge(pledge.id)}
                              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 text-sm"
                            >
                              <CreditCard className="w-4 h-4" />
                              Pay Pledge
                            </button>
                          )}
                        </div>
                      )}
                      
                      {!hasBalance && pledge.type === 'money' && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <button
                            disabled
                            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-100 text-green-800 rounded-md cursor-not-allowed text-sm"
                          >
                            <CreditCard className="w-4 h-4" />
                            Fully Paid
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : trackPhone && !isTracking ? (
              <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
                No pledges found for this phone number
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm sm:text-base">
                Enter your phone number to track pledges
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
