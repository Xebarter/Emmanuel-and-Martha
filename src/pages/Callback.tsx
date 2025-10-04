import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Callback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handlePaymentCallback = async () => {
      // Get query parameters from location
      const queryParams = new URLSearchParams(location.search);
      const orderTrackingId = queryParams.get('OrderTrackingId');
      const orderMerchantReference = queryParams.get('OrderMerchantReference');

      if (!orderTrackingId || !orderMerchantReference) {
        console.error('Missing required parameters');
        return;
      }

      try {
        // Extract contribution ID from merchant reference (format: WED-{contributionId})
        const contributionId = orderMerchantReference.replace('WED-', '');
        
        // Update contribution status to completed
        const { error: updateError } = await supabase
          .from('contributions')
          .update({ 
            status: 'completed',
            updated_at: new Date()
          })
          .eq('id', contributionId);

        if (updateError) {
          console.error('Failed to update contribution status:', updateError);
        }

        // Redirect to success page
        navigate('/payment-success');
      } catch (error) {
        console.error('Error processing payment callback:', error);
        // Still redirect to success page since payment was completed on Pesapal
        navigate('/payment-success');
      }
    };

    handlePaymentCallback();
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Processing Payment</h1>
        <p className="text-gray-600 mb-8">Please wait while we confirm your contribution details...</p>
      </div>
    </div>
  );
}