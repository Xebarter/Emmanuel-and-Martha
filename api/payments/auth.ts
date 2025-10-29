import { VercelRequest, VercelResponse } from '@vercel/node';

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
    const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
    const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
    const PESAPAL_ENVIRONMENT = process.env.PESAPAL_ENVIRONMENT || 'sandbox'; // 'sandbox' or 'live'

    console.log('Environment variables check:', {
      PESAPAL_CONSUMER_KEY: !!PESAPAL_CONSUMER_KEY,
      PESAPAL_CONSUMER_SECRET: !!PESAPAL_CONSUMER_SECRET,
      PESAPAL_ENVIRONMENT
    });

    if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
      throw new Error('Missing required environment variables for Pesapal');
    }

    // Determine the base URL based on environment
    const baseUrl = PESAPAL_ENVIRONMENT === 'live' 
      ? 'https://pay.pesapal.com/v3' 
      : 'https://cybqa.pesapal.com/pesapalv3';

    const authEndpoint = `${baseUrl}/api/Auth/RequestToken`;

    const response = await fetch(authEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        consumer_key: PESAPAL_CONSUMER_KEY,
        consumer_secret: PESAPAL_CONSUMER_SECRET,
      }),
    });

    console.log('Pesapal auth response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Pesapal auth failed with status:', response.status);
      console.error('Pesapal auth error details:', errorData);
      throw new Error(`Pesapal auth failed: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('Pesapal auth successful');
    res.status(200).json({
      token: data.token,
      expiryDate: data.expiryDate,
    });
  } catch (error) {
    console.error('Pesapal auth error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to authenticate with Pesapal',
    });
  }
}