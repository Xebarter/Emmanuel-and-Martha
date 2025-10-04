import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { queryPaymentStatus } from '../services/paymentService';

export default function IPNPage() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleIPN = async () => {
      try {
        // Get parameters from URL
        const orderTrackingId = searchParams.get('OrderTrackingId');
        const orderId = searchParams.get('orderId');
        
        if (!orderTrackingId) {
          console.error('Missing OrderTrackingId in IPN request');
          return;
        }

        // Query payment status from Pesapal
        const paymentDetails = await queryPaymentStatus(orderTrackingId);
        
        if (!paymentDetails) {
          console.error('Failed to retrieve payment details for IPN');
          return;
        }

        // Update contribution status in database
        const { error } = await supabase
          .from('contributions')
          .update({ 
            status: paymentDetails.status.toLowerCase(),
            metadata: {
              payment_method: paymentDetails.payment_method,
              payment_date: paymentDetails.date
            }
          })
          .eq('pesapal_reference', orderTrackingId);

        if (error) {
          console.error('Failed to update contribution status via IPN:', error);
        } else {
          console.log(`Successfully updated contribution status to ${paymentDetails.status}`);
        }
      } catch (error) {
        console.error('IPN processing error:', error);
      }
    };

    handleIPN();
  }, [searchParams]);

  // This page is for backend processing, so we don't need to render anything
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-4">
        <div className="p-8">
          <div className="flex flex-col items-center justify-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Payment Notification Received</h2>
            <p className="text-gray-600 text-center">
              Payment status is being processed. You can close this window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}