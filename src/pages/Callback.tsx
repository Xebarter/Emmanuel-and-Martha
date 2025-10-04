import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { queryPaymentStatus } from '../services/paymentService';

export default function CallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        // Get parameters from URL
        const orderTrackingId = searchParams.get('OrderTrackingId');
        
        if (!orderTrackingId) {
          setStatus('error');
          setMessage('Invalid callback parameters');
          return;
        }

        // Query payment status from Pesapal
        const paymentDetails = await queryPaymentStatus(orderTrackingId);
        
        if (!paymentDetails) {
          setStatus('error');
          setMessage('Failed to retrieve payment details');
          return;
        }

        // Update contribution status in database
        const { error: updateError } = await supabase
          .from('contributions')
          .update({ status: paymentDetails.status.toLowerCase() })
          .eq('pesapal_tracking_id', orderTrackingId);

        if (updateError) {
          console.error('Failed to update contribution status:', updateError);
        }

        if (paymentDetails.status === 'COMPLETED') {
          setStatus('success');
          setMessage('Payment successful! Thank you for your contribution.');
        } else if (paymentDetails.status === 'FAILED') {
          setStatus('error');
          setMessage('Payment failed. Please try again or contact support.');
        } else {
          setStatus('success');
          setMessage(`Payment status: ${paymentDetails.status}. We will update you once the payment is confirmed.`);
        }
      } catch (error) {
        console.error('Callback processing error:', error);
        setStatus('error');
        setMessage('Error processing payment callback');
      }
    };

    handlePaymentCallback();
  }, [searchParams]);

  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-4">
        <div className="p-8">
          <div className="flex flex-col items-center justify-center space-y-6">
            {status === 'loading' && (
              <>
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-rose-600"></div>
                <h2 className="text-2xl font-bold text-gray-800">Processing Payment</h2>
                <p className="text-gray-600 text-center">
                  Please wait while we confirm your payment details...
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="rounded-full bg-green-100 p-4">
                  <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Payment Processed</h2>
                <p className="text-gray-600 text-center">{message}</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 px-6 py-3 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors"
                >
                  Return to Homepage
                </button>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="rounded-full bg-red-100 p-4">
                  <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Payment Error</h2>
                <p className="text-gray-600 text-center">{message}</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 px-6 py-3 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors"
                >
                  Return to Homepage
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}