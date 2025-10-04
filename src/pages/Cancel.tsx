import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function CancelPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSimulated, setIsSimulated] = useState(false);

  useEffect(() => {
    const handlePaymentCancel = async () => {
      try {
        // Get parameters from URL
        const orderTrackingId = searchParams.get('OrderTrackingId');
        const isSimulated = searchParams.get('simulated');

        if (orderTrackingId && !isSimulated) {
          // Update contribution status to cancelled
          const { error } = await supabase
            .from('contributions')
            .update({ status: 'cancelled' })
            .eq('pesapal_tracking_id', orderTrackingId);

          if (error) {
            console.error('Failed to update contribution status:', error);
          }
        }

        // Small delay to simulate processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsProcessing(false);
      } catch (error) {
        console.error('Error handling payment cancellation:', error);
        setIsProcessing(false);
      }
    };

    handlePaymentCancel();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-4">
        <div className="p-8">
          <div className="flex flex-col items-center justify-center space-y-6">
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-rose-600"></div>
                <h2 className="text-2xl font-bold text-gray-800">Processing Cancellation</h2>
                <p className="text-gray-600 text-center">
                  Please wait while we process your payment cancellation...
                </p>
              </>
            ) : (
              <>
                <div className="rounded-full bg-amber-100 p-4">
                  <svg className="w-16 h-16 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Payment Cancelled</h2>
                <p className="text-gray-600 text-center">
                  Your payment has been cancelled. No charges have been made to your account.
                </p>
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