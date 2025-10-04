import { DollarSign, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { normalizePhone, formatCurrency } from '../lib/utils';
import { initiatePesapalPayment } from '../services/paymentService';

const contributionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  amount: z.number().min(1000, 'Minimum contribution is 1,000 UGX'),
  message: z.string().optional(),
});

type ContributionForm = z.infer<typeof contributionSchema>;

interface ContributeSectionProps {
  totalContributions: number;
}

// Simple hash function for generating guest identifier
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

export function ContributeSection({ totalContributions }: ContributeSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContributionForm>({
    resolver: zodResolver(contributionSchema),
  });

  const onSubmit = async (data: ContributionForm) => {
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
            email: data.email || null,
            message: data.message || null,
          })
          .select('id')
          .single();

        if (guestError) throw guestError;
        guestId = newGuest.id;
      }

      // Generate a more robust payment reference with additional entropy
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 15); // Longer random string
      const guestHash = simpleHash(normalizedPhone).substring(0, 8); // Unique guest identifier
      const pesapalReference = `WED-${timestamp}-${guestHash}-${randomSuffix}`;

      // Insert contribution with pending status
      const { data: contributionData, error: contributionError } = await supabase
        .from('contributions')
        .insert({
          guest_id: guestId,
          amount: data.amount,
          currency: 'UGX',
          pesapal_reference: pesapalReference, // Using correct column name
          status: 'pending',
          metadata: { name: data.name, phone: normalizedPhone },
        })
        .select()
        .single();

      if (contributionError) throw contributionError;

      // Initiate Pesapal payment
      const paymentResult = await initiatePesapalPayment(
        contributionData.id,
        data.amount,
        'UGX',
        data.name,
        data.email || '',
        normalizedPhone,
        'Wedding Contribution',
      );

      if (paymentResult.error) {
        throw new Error(paymentResult.error);
      }

      // Redirect to Pesapal payment page
      if (paymentResult.redirectUrl) {
        window.location.href = paymentResult.redirectUrl;
      } else {
        throw new Error('Failed to get payment redirect URL');
      }

      setSubmitMessage({
        type: 'success',
        text: 'Redirecting to payment page...',
      });
      reset();
    } catch (error) {
      console.error('Contribution error:', error);
      setSubmitMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to process contribution. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contribute" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            Contribute to Our Celebration
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Your generous contribution helps us start our journey together
          </p>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-50 to-amber-50 px-8 py-4 rounded-full border border-rose-200">
            <DollarSign className="w-6 h-6 text-rose-600" />
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalContributions)}
            </span>
            <span className="text-gray-600">raised so far</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-50 rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="John Doe"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                {...register('phone')}
                type="tel"
                id="phone"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="+256700000000"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email (Optional)
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              placeholder="john@example.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div className="mb-6">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount (UGX) *
            </label>
            <input
              {...register('amount', { valueAsNumber: true })}
              type="number"
              id="amount"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              placeholder="50000"
              step="1000"
            />
            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
          </div>

          <div className="mb-6">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message (Optional)
            </label>
            <textarea
              {...register('message')}
              id="message"
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              placeholder="Best wishes for your wedding..."
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
            className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white py-4 rounded-lg font-semibold hover:from-rose-600 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Contribute Now'
            )}
          </button>
        </form>
      </div>
    </section>
  );
}