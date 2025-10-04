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
        
        // Get the contribution details
        const { data: contribution, error: contributionError } = await supabase
          .from('contributions')
          .select('*')
          .eq('id', contributionId)
          .single();

        if (contributionError) {
          console.error('Failed to fetch contribution:', contributionError);
          navigate('/payment-success');
          return;
        }
        
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

        // If this contribution is for fulfilling a pledge, update the pledge
        if (contribution.metadata && contribution.metadata.pledge_id) {
          const pledgeId = contribution.metadata.pledge_id;
          
          // Get current pledge details
          const { data: pledge, error: pledgeError } = await supabase
            .from('pledges')
            .select('amount, fulfilled_amount')
            .eq('id', pledgeId)
            .single();

          if (!pledgeError && pledge) {
            // Calculate new fulfilled amount
            const newFulfilledAmount = (pledge.fulfilled_amount || 0) + contribution.amount;
            const newStatus = newFulfilledAmount >= (pledge.amount || 0) ? 'fulfilled' : 'pending';
            const fulfilledAt = newStatus === 'fulfilled' ? new Date().toISOString() : null;

            // Update pledge
            const { error: pledgeUpdateError } = await supabase
              .from('pledges')
              .update({
                fulfilled_amount: newFulfilledAmount,
                status: newStatus,
                fulfilled_at: fulfilledAt,
                updated_at: new Date()
              })
              .eq('id', pledgeId);

            if (pledgeUpdateError) {
              console.error('Failed to update pledge:', pledgeUpdateError);
            }
          }
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