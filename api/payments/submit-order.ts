import { VercelRequest, VercelResponse } from '@vercel/node';

interface OrderRequest {
  amount: number;
  currency: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  reference: string;
  description: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const PESAPAL_API_URL = process.env.PESAPAL_API_URL;
    const PESAPAL_CALLBACK_URL = process.env.PESAPAL_CALLBACK_URL;
    const PESAPAL_CANCEL_URL = process.env.PESAPAL_CANCEL_URL;
    const PESAPAL_IPN_ID = process.env.PESAPAL_IPN_ID;

    console.log('Environment variables check:', {
      PESAPAL_API_URL: !!PESAPAL_API_URL,
      PESAPAL_CALLBACK_URL: !!PESAPAL_CALLBACK_URL,
      PESAPAL_CANCEL_URL: !!PESAPAL_CANCEL_URL,
      PESAPAL_IPN_ID: !!PESAPAL_IPN_ID
    });

    if (!PESAPAL_API_URL || !PESAPAL_CALLBACK_URL || !PESAPAL_CANCEL_URL || !PESAPAL_IPN_ID) {
      throw new Error('Missing required environment variables for Pesapal order submission');
    }

    // Get auth token first
    const authUrl = `${req.headers.origin || 'https://priscillaandjohn.vercel.app'}/api/payments/auth`;
    console.log('Authenticating with:', authUrl);
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Auth response status:', authResponse.status);

    if (!authResponse.ok) {
      const errorData = await authResponse.json().catch(() => ({}));
      console.error('Auth service error details:', errorData);
      throw new Error('Failed to authenticate with Pesapal');
    }

    const { token } = await authResponse.json();
    console.log('Authentication token received');
    
    const {
      amount,
      currency,
      firstName,
      lastName,
      email,
      phone,
      reference,
      description,
    } = req.body as OrderRequest;

    // Ensure the URL ends with the correct path
    const orderEndpoint = PESAPAL_API_URL.endsWith('/Transactions/SubmitOrderRequest') 
      ? PESAPAL_API_URL 
      : `${PESAPAL_API_URL.replace(/\/$/, '')}/Transactions/SubmitOrderRequest`;

    const response = await fetch(
      orderEndpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: reference,
          currency: currency,
          amount: amount,
          description: description,
          callback_url: PESAPAL_CALLBACK_URL,
          cancel_url: PESAPAL_CANCEL_URL,
          notification_id: PESAPAL_IPN_ID,
          billing_address: {
            email_address: email,
            phone_number: phone,
            country_code: 'KE',
            first_name: firstName,
            last_name: lastName,
            line_1: 'N/A',
            city: 'Nairobi',
            postal_code: '00100',
          },
        }),
      }
    );

    console.log('Pesapal order submission response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Pesapal order submission failed with status:', response.status);
      console.error('Pesapal order submission error details:', errorData);
      throw new Error(`Pesapal order submission failed: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('Pesapal order submission successful');
    res.status(200).json({
      order_tracking_id: data.order_tracking_id,
      redirect_url: data.redirect_url,
    });
  } catch (error) {
    console.error('Pesapal order submission error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to submit order to Pesapal',
    });
  }
}