import { supabase } from '../lib/supabase';

// Define types for our payment service
interface PesapalOrderResponse {
  order_tracking_id: string;
  redirect_url: string;
  error?: string;
}

interface PesapalPaymentDetails {
  id: string;
  status: string;
  payment_method: string;
  date: string;
}

/**
 * Submit an order to Pesapal via our secure serverless function
 */
async function submitOrderToPesapal(
  amount: number,
  currency: string,
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  reference: string,
  description: string,
  callbackUrl: string,
  cancelUrl: string,
  ipnId: string
): Promise<PesapalOrderResponse> {
  try {
    const response = await fetch('/api/payments/submit-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        firstName,
        lastName,
        email,
        phone,
        reference,
        description,
        callbackUrl,
        cancelUrl,
        ipnId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit order');
    }

    return await response.json();
  } catch (error) {
    console.error('Pesapal order submission error:', error);
    return {
      order_tracking_id: '',
      redirect_url: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Initiate a Pesapal payment
 */
export async function initiatePesapalPayment(
  contributionId: string,
  amount: number,
  currency: string,
  name: string,
  email: string,
  phone: string,
  description: string
): Promise<{ redirectUrl: string | null; error: string | null }> {
  try {
    // Split name into first and last name (simple approach)
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Guest';
    
    // Generate a unique reference
    const reference = `WED-${contributionId}`;
    
    // Update the existing contribution record with payment method
    const { error: updateError } = await supabase
      .from('contributions')
      .update({
        payment_method: 'pesapal',
        metadata: {
          ...(await getContributionMetadata(contributionId))?.metadata || {},
          payment_method: 'pesapal',
          initiated_at: new Date().toISOString(),
        },
      })
      .eq('id', contributionId);

    if (updateError) {
      console.error('Error updating contribution:', updateError);
      // Continue anyway as this is not critical
    }
    
    // Submit the order to Pesapal via our serverless function
    const result = await submitOrderToPesapal(
      amount,
      currency,
      firstName,
      lastName,
      email,
      phone,
      reference,
      description,
      `${window.location.origin}/payment/callback`,
      `${window.location.origin}/payment/cancel`,
      'wedding-app-ipn' // This should match your Pesapal IPN configuration
    );

    if (result.error || !result.redirect_url) {
      throw new Error(result.error || 'No redirect URL received from payment gateway');
    }

    // Update contribution with tracking ID
    const { error: trackingUpdateError } = await supabase
      .from('contributions')
      .update({ 
        pesapal_tracking_id: result.order_tracking_id,
        status: 'pending_payment',
        updated_at: new Date().toISOString(),
      })
      .eq('id', contributionId);

    if (trackingUpdateError) {
      console.error('Error updating contribution tracking ID:', trackingUpdateError);
      // Don't fail the whole process if this update fails
    }

    return { 
      redirectUrl: result.redirect_url,
      error: null 
    };
  } catch (error) {
    console.error('Payment initiation error:', error);
    
    // Update contribution status to failed
    try {
      await supabase
        .from('contributions')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString(),
          metadata: {
            ...(await getContributionMetadata(contributionId))?.metadata || {},
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })
        .eq('id', contributionId);
    } catch (updateError) {
      console.error('Error updating failed contribution:', updateError);
    }
    
    return { 
      redirectUrl: null, 
      error: error instanceof Error ? error.message : 'Failed to initiate payment' 
    };
  }
}

// Helper function to get contribution metadata
async function getContributionMetadata(contributionId: string) {
  const { data, error } = await supabase
    .from('contributions')
    .select('metadata')
    .eq('id', contributionId)
    .single();
    
  if (error) {
    console.error('Error fetching contribution metadata:', error);
    return null;
  }
  
  return data;
}

/**
 * Query the status of a payment
 */
export async function queryPaymentStatus(orderTrackingId: string): Promise<PesapalPaymentDetails | null> {
  try {
    if (!orderTrackingId) {
      throw new Error('No order tracking ID provided');
    }

    // Get the latest status from our database first
    const { data: contribution, error } = await supabase
      .from('contributions')
      .select('*')
      .eq('pesapal_reference', orderTrackingId)
      .single();

    if (error || !contribution) {
      throw new Error('Contribution not found');
    }

    return {
      id: contribution.id,
      status: contribution.status,
      payment_method: 'pesapal',
      date: contribution.updated_at || contribution.created_at,
    };
  } catch (error) {
    console.error('Payment status query error:', error);
    return null;
  }
}
