// Secure MailerLite Newsletter API Endpoint
// This function runs on Vercel's servers, keeping your API key safe

export default async function handler(req, res) {
    // Set CORS headers for your domain
    res.setHeader('Access-Control-Allow-Origin', '*'); // In production, replace * with your domain
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

    // Check if API key is configured
    const apiKey = process.env.MAILERLITE_API_KEY;
    if (!apiKey) {
        console.error('MAILERLITE_API_KEY environment variable not set');
        return res.status(500).json({ 
            success: false, 
            error: 'Server configuration error' 
        });
    }

    // Validate request body
    const { email, language } = req.body;
    
    if (!email) {
        return res.status(400).json({ 
            success: false, 
            error: 'Email is required' 
        });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid email format' 
        });
    }

    try {
        // Call MailerLite API
        const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                groups: ['159286458087114300'], // Your group ID
                fields: {
                    signup_source: 'website',
                    language: language || 'es'
                }
            })
        });

        const responseData = await response.json();

        // Debug logging - remove this after fixing
        console.log('MailerLite Response Status:', response.status);
        console.log('MailerLite Response Data:', JSON.stringify(responseData, null, 2));

        if (response.ok) {
            // Success
            return res.status(200).json({ 
                success: true,
                message: 'Successfully subscribed to newsletter'
            });
        } else {
            // MailerLite returned an error
            console.error('MailerLite API Error:', responseData);
            
            // Handle specific MailerLite errors
            if (response.status === 422 && responseData.message?.includes('already exists')) {
                return res.status(409).json({ 
                    success: false, 
                    error: 'Email already subscribed' 
                });
            }
            
            return res.status(400).json({ 
                success: false, 
                error: 'Failed to subscribe to newsletter' 
            });
        }
    } catch (error) {
        console.error('Newsletter API Error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
} 