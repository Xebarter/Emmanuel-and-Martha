import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Callback() {
  const navigate = useNavigate();
  const location = useLocation();

  // Add error handling and proper state management
  useEffect(() => {
    // Get query parameters from location
    const queryParams = new URLSearchParams(location.search);
    const OrderTrackingId = queryParams.get('OrderTrackingId');
    const OrderMerchantReference = queryParams.get('OrderMerchantReference');

    if (!OrderTrackingId || !OrderMerchantReference) {
      // Handle missing parameters
      return;
    }

    // Simulate API call to verify payment status
    const verifyPayment = async () => {
      try {
        // Make API call to verify payment status
        const response = await fetch(`/api/payment/verify?trackingId=${OrderTrackingId}&merchantRef=${OrderMerchantReference}`);
        
        if (response.ok) {
          const data = await response.json();
          
          // If payment is successful, redirect to success page
          if (data.status === 'success') {
            navigate('/payment-success');
          }
        } else {
          // Handle API errors properly
          console.error('Failed to verify payment:', response.statusText);
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
      }
    };

    verifyPayment();
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Error icon */}
        <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-red-100">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Error</h1>
        <p className="text-gray-600 mb-8">Failed to retrieve payment details</p>
        
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Return to Homepage
        </button>
      </div>
    </div>
  );
}