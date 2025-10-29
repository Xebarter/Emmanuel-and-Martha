# Deployment Guide

## Environment Variables

For proper deployment, you need to configure two sets of environment variables:

### 1. Frontend Environment Variables (.env)

These variables are prefixed with `VITE_` and are embedded in the client-side bundle:

```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_STORAGE_BUCKET=gallery

VITE_PESAPAL_ENVIRONMENT=sandbox # or 'live' for production
VITE_PESAPAL_CONSUMER_KEY=your-pesapal-consumer-key
VITE_PESAPAL_CONSUMER_SECRET=your-pesapal-consumer-secret
VITE_PESAPAL_IPN_ID=your-pesapal-ipn-id
VITE_PESAPAL_IPN_URL=https://yourdomain.com/api/payments/ipn
VITE_PESAPAL_CALLBACK_URL=https://yourdomain.com/callback
VITE_PESAPAL_CANCEL_URL=https://yourdomain.com/cancel

VITE_SITE_NAME=Your Wedding Name
VITE_CONTACT_EMAIL=contact@yourdomain.com
```

### 2. Serverless Functions Environment Variables (.env.local)

These variables are used by the serverless functions and should NOT be prefixed with `VITE_`:

```
PESAPAL_ENVIRONMENT=sandbox # or 'live' for production
PESAPAL_CONSUMER_KEY=your-pesapal-consumer-key
PESAPAL_CONSUMER_SECRET=your-pesapal-consumer-secret
PESAPAL_IPN_ID=your-pesapal-ipn-id
PESAPAL_IPN_URL=https://yourdomain.com/api/payments/ipn
PESAPAL_CALLBACK_URL=https://yourdomain.com/callback
PESAPAL_CANCEL_URL=https://yourdomain.com/cancel

SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## Vercel Deployment

When deploying to Vercel, you need to add both sets of environment variables in your project settings:

1. For frontend variables, add them as they are (with VITE_ prefix)
2. For serverless function variables, add them without the VITE_ prefix

## Domain Configuration

Make sure to update your Pesapal account with your production domain URLs:
- IPN URL: `https://yourdomain.com/api/payments/ipn`
- Callback URL: `https://yourdomain.com/callback`
- Cancel URL: `https://yourdomain.com/cancel`

## Supabase Configuration

Ensure your Supabase project is properly configured with:
1. All required tables and RLS policies
2. Storage bucket for gallery images
3. Service role key for serverless functions