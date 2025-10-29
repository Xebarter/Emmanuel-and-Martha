import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log the raw request body for debugging
    console.log('Raw IPN Body:', req.body);

    const {
      OrderNotificationType,
      OrderMerchantReference,
      OrderTrackingId,
      OrderReference,
      PaymentStatus,
      PaymentStatusDescription, // Added for more detailed status info
    } = req.body;

    console.log('IPN Received:', {
      OrderNotificationType,
      OrderMerchantReference,
      OrderTrackingId,
      OrderReference,
      PaymentStatus,
      PaymentStatusDescription,
    });

    // Handle different notification types
    if (OrderNotificationType === 'IPN' && OrderMerchantReference) {
      // Extract contribution ID from the reference (format: WED-{contributionId})
      const contributionId = OrderMerchantReference.replace('WED-', '');
      
      // Map Pesapal status to our status
      let status = 'pending';
      if (PaymentStatus === 'COMPLETED') {
        status = 'completed';
      } else if (['FAILED', 'INVALID'].includes(PaymentStatus)) {
        status = 'failed';
      } else if (PaymentStatus === 'CANCELLED') {
        status = 'cancelled';
      }

      // Update the contribution in the database
      const { error } = await supabase
        .from('contributions')
        .update({
          pesapal_tracking_id: OrderTrackingId,
          pesapal_reference: OrderReference,
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contributionId);

      if (error) {
        console.error('Error updating contribution:', error);
        return res.status(500).json({ error: 'Failed to update contribution' });
      }

      console.log(`Updated contribution ${contributionId} with status: ${status}`);
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('IPN processing error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to process IPN',
    });
  }
}