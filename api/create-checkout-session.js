// Stripe Checkout Session API Endpoint
// This function creates Stripe checkout sessions for subscription payments

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed. Use POST.' 
        });
    }

    // Check if Stripe secret key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('STRIPE_SECRET_KEY environment variable not set');
        return res.status(500).json({ 
            success: false, 
            error: 'Server configuration error' 
        });
    }

    try {
        const { priceId, customerEmail, customerName, customerPhone, classInterest } = req.body;

        // Validate required fields
        if (!priceId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Price ID is required' 
            });
        }

        // Define your domain (replace with your actual domain)
        const domain = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : 'http://localhost:3000';

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            billing_address_collection: 'auto',
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${domain}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${domain}/?checkout=cancelled`,
            customer_email: customerEmail,
            metadata: {
                customerName: customerName || '',
                customerPhone: customerPhone || '',
                classInterest: classInterest || ''
            },
            subscription_data: {
                billing_mode: { type: 'flexible' },
                metadata: {
                    customerName: customerName || '',
                    customerPhone: customerPhone || '',
                    classInterest: classInterest || ''
                }
            }
        });

        return res.status(200).json({
            success: true,
            url: session.url
        });

    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Failed to create checkout session' 
        });
    }
} 