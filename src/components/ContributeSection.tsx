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
  amount: z.number().min(500, 'Minimum contribution is 500 UGX'),
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
          contributor_name: data.name,
          contributor_email: data.email || null,
          contributor_phone: normalizedPhone,
          message: data.message || null,
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
        // Check if it's a network/API error
        if (paymentResult.error.includes('404') || paymentResult.error.includes('Failed to fetch')) {
          throw new Error('Payment service is currently unavailable. Please try again later or contact the site administrator.');
        }
        throw new Error(paymentResult.error);
      }

      // Redirect to Pesapal payment page
      if (paymentResult.redirectUrl) {
        window.location.href = paymentResult.redirectUrl;
      } else {
        throw new Error('Failed to get payment redirect URL. Please try again.');
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
    <section id="contribute" className="py-16 md:py-20 bg-gradient-to-br from-white via-rose-50 to-amber-50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-3 md:mb-4">
            Contribute to Our Celebration
          </h2>
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-3">
            <div className="h-px w-8 md:w-16 bg-gradient-to-r from-transparent via-rose-300 to-transparent"></div>
            <DollarSign className="w-4 h-4 text-rose-500" />
            <div className="h-px w-8 md:w-16 bg-gradient-to-l from-transparent via-rose-300 to-transparent"></div>
          </div>
          <p className="text-base md:text-lg text-gray-600">
            Your generous contribution helps us start our journey together
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6 md:p-8 border border-white/60">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white/70"
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white/70"
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
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white/70"
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
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white/70"
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
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white/70"
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
            className="w-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-rose-600 text-white py-4 rounded-lg font-semibold hover:from-rose-600 hover:to-fuchsia-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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