/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable static exports for single-page application (SPA) mode
  output: 'export',
  // Optional: Add a trailing slash to all paths
  trailingSlash: true,
  // Optional: Configure image optimization
  images: {
    unoptimized: true,
  },
  // Environment variables that should be available on the client side
  env: {
    // Add any client-side environment variables here
    // They must be prefixed with NEXT_PUBLIC_
  },
  // Handle environment variables
  publicRuntimeConfig: {
    // Will be available on both server and client
    SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    PESAPAL_API_URL: process.env.VITE_PESAPAL_API_URL || process.env.NEXT_PUBLIC_PESAPAL_API_URL,
    PESAPAL_CONSUMER_KEY: process.env.VITE_PESAPAL_CONSUMER_KEY || process.env.NEXT_PUBLIC_PESAPAL_CONSUMER_KEY,
    PESAPAL_CALLBACK_URL: process.env.VITE_PESAPAL_CALLBACK_URL || process.env.NEXT_PUBLIC_PESAPAL_CALLBACK_URL,
    PESAPAL_CANCEL_URL: process.env.VITE_PESAPAL_CANCEL_URL || process.env.NEXT_PUBLIC_PESAPAL_CANCEL_URL,
    PESAPAL_IPN_ID: process.env.VITE_PESAPAL_IPN_ID || process.env.NEXT_PUBLIC_PESAPAL_IPN_ID,
  },
  // Configure headers
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
