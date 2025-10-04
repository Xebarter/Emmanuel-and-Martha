import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function CancelPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handlePaymentCancel = async () => {
      try {
        // Get parameters from URL
        const orderTrackingId = searchParams.get('OrderTrackingId');
        
        if (orderTrackingId) {
          // Update contribution status to cancelled
          const { error } = await supabase
            .from('contributions')
            .update({ status: 'cancelled' })
            .eq('pesapal_reference', orderTrackingId);

          if (error) {
            console.error('Failed to update contribution status:', error);
          }
        }
      } catch (error) {
        console.error('Error handling payment cancellation:', error);
      }
    };

    handlePaymentCancel();
  }, [searchParams]);

  const handleReturnHome = () => {
    navigate('/');
  };

  const handleTryAgain = () => {
    navigate('/#contribute');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-4">
        <div className="p-8">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="rounded-full bg-yellow-100 p-4">
              <svg className="w-16 h-16 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Payment Cancelled</h2>
            <p className="text-gray-600 text-center">
              Your payment has been cancelled. If you wish to make a contribution, you can try again.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button
                onClick={handleReturnHome}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
              >
                Return Home
              </button>
              <button
                onClick={handleTryAgain}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}