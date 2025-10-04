import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const PESAPAL_API_URL = process.env.PESAPAL_API_URL;
    const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
    const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;

    if (!PESAPAL_API_URL || !PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
      throw new Error('Missing required environment variables for Pesapal');
    }

    const response = await fetch(`${PESAPAL_API_URL}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        key: PESAPAL_CONSUMER_KEY,
        secret: PESAPAL_CONSUMER_SECRET,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Pesapal auth failed: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
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
