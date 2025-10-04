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
    const PESAPAL_API_URL = process.env.PESAPAL_API_URL;
    const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
    const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;

    console.log('Environment variables check:', {
      PESAPAL_API_URL: !!PESAPAL_API_URL,
      PESAPAL_CONSUMER_KEY: !!PESAPAL_CONSUMER_KEY,
      PESAPAL_CONSUMER_SECRET: !!PESAPAL_CONSUMER_SECRET
    });

    if (!PESAPAL_API_URL || !PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
      throw new Error('Missing required environment variables for Pesapal');
    }

    // Ensure the URL ends with the correct path
    const authEndpoint = PESAPAL_API_URL.endsWith('/Auth/RequestToken') 
      ? PESAPAL_API_URL 
      : `${PESAPAL_API_URL.replace(/\/$/, '')}/Auth/RequestToken`;

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