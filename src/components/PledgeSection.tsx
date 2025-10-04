import { Gift, Search, Loader2, Package, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { normalizePhone, formatCurrency, formatDate } from '../lib/utils';
import { Pledge } from '../lib/types';

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

interface PledgeSectionProps {
  totalPledges: number;
}

export function PledgeSection({ totalPledges }: PledgeSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [trackPhone, setTrackPhone] = useState('');
  const [trackedPledges, setTrackedPledges] = useState<Pledge[]>([]);
  const [isTracking, setIsTracking] = useState(false);

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
        .select('*')
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

  return (
    <section id="pledge" className="py-20 bg-gradient-to-br from-amber-50 via-white to-rose-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            Make a Pledge
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Promise to contribute money or items for our special day
          </p>
          <div className="inline-flex items-center gap-2 bg-white px-8 py-4 rounded-full shadow-lg border border-amber-200">
            <Gift className="w-6 h-6 text-amber-600" />
            <span className="text-2xl font-bold text-gray-900">{totalPledges}</span>
            <span className="text-gray-600">pledges made</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Create Your Pledge</h3>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-6">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  id="name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div className="mb-6">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  id="phone"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="+256700000000"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Pledge Type *</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-amber-500">
                    <input
                      {...register('type')}
                      type="radio"
                      value="money"
                      className="mr-3"
                    />
                    <DollarSign className="w-5 h-5 mr-2 text-amber-600" />
                    <span className="font-medium">Money</span>
                  </label>
                  <label className="flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-amber-500">
                    <input
                      {...register('type')}
                      type="radio"
                      value="item"
                      className="mr-3"
                    />
                    <Package className="w-5 h-5 mr-2 text-amber-600" />
                    <span className="font-medium">Item</span>
                  </label>
                </div>
              </div>

              {pledgeType === 'money' && (
                <div className="mb-6">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Pledge Amount (UGX) *
                  </label>
                  <input
                    {...register('amount', { valueAsNumber: true })}
                    type="number"
                    id="amount"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="50000"
                    step="1000"
                  />
                </div>
              )}

              {pledgeType === 'item' && (
                <>
                  <div className="mb-6">
                    <label htmlFor="item_description" className="block text-sm font-medium text-gray-700 mb-2">
                      Item Description *
                    </label>
                    <input
                      {...register('item_description')}
                      type="text"
                      id="item_description"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="e.g., 10 plastic chairs"
                    />
                  </div>
                  <div className="mb-6">
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      {...register('quantity', { valueAsNumber: true })}
                      type="number"
                      id="quantity"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="1"
                      min="1"
                    />
                  </div>
                </>
              )}

              <div className="mb-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  {...register('notes')}
                  id="notes"
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Any additional information..."
                />
              </div>

              {submitMessage && (
                <div
                  className={`mb-6 p-4 rounded-lg ${
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

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Track Your Pledges</h3>
            <p className="text-gray-600 mb-6">
              Enter your phone number to view all pledges you've made
            </p>

            <div className="flex gap-2 mb-6">
              <input
                type="tel"
                value={trackPhone}
                onChange={(e) => setTrackPhone(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="+256700000000"
              />
              <button
                onClick={handleTrackPledges}
                disabled={isTracking || !trackPhone}
                className="px-6 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTracking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </button>
            </div>

            {trackedPledges.length > 0 ? (
              <div className="space-y-4">
                {trackedPledges.map((pledge) => (
                  <div key={pledge.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {pledge.type === 'money' ? (
                          <DollarSign className="w-5 h-5 text-amber-600" />
                        ) : (
                          <Package className="w-5 h-5 text-amber-600" />
                        )}
                        <span className="font-semibold text-gray-900">
                          {pledge.type === 'money'
                            ? formatCurrency(pledge.amount || 0)
                            : pledge.item_description}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
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
                    <p className="text-xs text-gray-500">Pledged on {formatDate(pledge.created_at)}</p>
                    {pledge.fulfilled_at && (
                      <p className="text-xs text-green-600 mt-1">Fulfilled on {formatDate(pledge.fulfilled_at)}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : trackPhone && !isTracking ? (
              <div className="text-center py-8 text-gray-500">
                No pledges found for this phone number
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Enter your phone number to track pledges
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
