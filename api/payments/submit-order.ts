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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const PESAPAL_API_URL = process.env.PESAPAL_API_URL;
    const PESAPAL_CALLBACK_URL = process.env.PESAPAL_CALLBACK_URL;
    const PESAPAL_CANCEL_URL = process.env.PESAPAL_CANCEL_URL;
    const PESAPAL_IPN_ID = process.env.PESAPAL_IPN_ID;

    if (!PESAPAL_API_URL || !PESAPAL_CALLBACK_URL || !PESAPAL_CANCEL_URL || !PESAPAL_IPN_ID) {
      throw new Error('Missing required environment variables for Pesapal order submission');
    }

    // Get auth token first
    const authResponse = await fetch(`${req.headers.origin}/api/payments/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!authResponse.ok) {
      throw new Error('Failed to authenticate with Pesapal');
    }

    const { token } = await authResponse.json();
    
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

    const response = await fetch(
      `${PESAPAL_API_URL}/api/Transactions/SubmitOrderRequest`,
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

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Pesapal order submission failed: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
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
