# Pesapal API v3 Integration Guide

This document explains how the wedding website integrates with Pesapal API v3 for payment processing.

## Overview

The integration follows Pesapal API v3 specifications which is a RESTful API with data entities represented as HTTP resources accessed using GET and POST methods. All requests and responses are JSON encoded.

## Base URLs

The integration automatically uses the correct endpoints based on the `PESAPAL_ENVIRONMENT` environment variable:

| Environment | Base URL |
|-------------|----------|
| Sandbox | https://cybqa.pesapal.com/pesapalv3 |
| Live | https://pay.pesapal.com/v3 |

## Authentication

Authentication is handled automatically by the payment service. The process:

1. Serverless function `/api/payments/auth` requests a token from Pesapal
2. Token is used in the Authorization header for subsequent requests

## API Endpoints Implementation

### 1. IPN Registration

IPN URLs are pre-registered in the Pesapal merchant dashboard:
- Endpoint: `/api/payments/ipn`
- Full URL: `https://yourdomain.com/api/payments/ipn`

### 2. Submit Order Request

Handled by the serverless function `/api/payments/submit-order` which:
1. Authenticates with Pesapal to get a token
2. Submits the order with all required details
3. Returns the redirect URL to complete payment

### 3. Get Transaction Status

Implemented in the frontend service function [queryPaymentStatus](file:///d:/PROJECTS/Emmanuel-and-Martha/src/services/paymentService.ts#L130-L187) which allows checking payment status by [orderTrackingId](file:///d:/PROJECTS/Emmanuel-and-Martha/src/lib/types.ts#L50-L57).

### 4. Order Cancellation

Implemented in the frontend service function [cancelOrder](file:///d:/PROJECTS/Emmanuel-and-Martha/src/services/paymentService.ts#L189-L223) which allows cancelling incomplete or failed orders.

## Data Flow

1. User initiates a contribution/pledge on the website
2. Website calls [submitOrderToPesapal](file:///d:/PROJECTS/Emmanuel-and-Martha/src/services/paymentService.ts#L18-L71) with payment details
3. Frontend service calls `/api/payments/submit-order` serverless function
4. Serverless function authenticates with Pesapal and submits the order
5. Pesapal returns redirect URL which is passed back to the frontend
6. User is redirected to Pesapal to complete payment
7. After payment, user is redirected back to the website via callback URL
8. Pesapal sends IPN notification to `/api/payments/ipn` with payment status
9. IPN handler updates the contribution status in the database

## Environment Variables

Required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `PESAPAL_ENVIRONMENT` | Either 'sandbox' or 'live' | sandbox |
| `PESAPAL_CONSUMER_KEY` | Your Pesapal consumer key | - |
| `PESAPAL_CONSUMER_SECRET` | Your Pesapal consumer secret | - |
| `PESAPAL_IPN_ID` | Your registered IPN ID | - |
| `PESAPAL_CALLBACK_URL` | Success redirect URL | https://yoursite.com/callback |
| `PESAPAL_CANCEL_URL` | Cancel redirect URL | https://yoursite.com/cancel |

## Error Handling

All API responses are properly handled including error responses which follow the Pesapal standard:

```json
{
  "error": {
    "type": "error_type",
    "code": "response_code",
    "message": "Detailed error message goes here.."
  }
}
```

## Recurring Payments

The integration currently does not support recurring payments, but the structure is in place to add this feature in the future by adding subscription details to the order request.