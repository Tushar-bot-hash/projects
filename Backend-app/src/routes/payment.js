const express = require('express');
const router = express.Router();
const stripe = require('stripe');

// =========================================================================
// 1. TOP-LEVEL DEPENDENCY REQUIREMENTS (Fail-Fast Approach)
// =========================================================================

// Destructure the 'protect' function from your auth.js middleware
const { protect } = require('../middleware/auth'); 
const Order = require('../models/Order');
const Cart = require('../models/Cart');

// =========================================================================
// 2. STRIPE INITIALIZATION (Configuration Check)
// =========================================================================

let stripeInstance;
if (process.env.STRIPE_SECRET_KEY) {
    stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe initialized successfully.');
} else {
    // If the key is missing, log a critical error but don't crash the server startup.
    // The route handler will return a 500 error if called.
    console.error('❌ FATAL: STRIPE_SECRET_KEY is not defined. Payment routes are disabled.');
}

// =========================================================================
// 3. ROUTES
// =========================================================================

// @route   GET /api/payment/test
// @desc    Test route - checks if Stripe is configured
// @access  Public
router.get('/test', (req, res) => {
    console.log('✅ Payment test route hit!');
    res.json({ 
        success: true, 
        message: 'Payment routes are working!',
        stripeConfigured: !!stripeInstance,
    });
});

// @route   POST /api/payment/create-checkout-session
// @desc    Create Stripe checkout session
// @access  Private (using the correct 'protect' middleware)
router.post('/create-checkout-session', protect, async (req, res) => {
    
    try {
        // --- 3a. Initial Checks ---
        if (!stripeInstance) {
            return res.status(500).json({
                message: 'Payment service not configured',
                error: 'STRIPE_SECRET_KEY is missing on the server.'
            });
        }

        console.log('Create checkout session initiated by user:', req.user._id);
        
        // Ensure you are receiving cartItems and totalAmount from the frontend request body
        const { cartItems, totalAmount } = req.body;
        const userId = req.user._id; // Assumes your 'protect' middleware attaches the Mongoose object ID
        const userEmail = req.user.email || 'guest@example.com'; // Use user email for Stripe customer creation if available

        // --- 3b. Line Items Generation ---
        // Validate input data from the frontend before proceeding
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'Cart items cannot be empty.' });
        }
        
        const lineItems = cartItems.map(item => {
            // Stripe amounts must be in CENTS (or the smallest currency unit).
            // Multiply by 100 and ensure it's an integer.
            const unitAmountInCents = Math.round(item.price * 100); 

            return {
                price_data: {
                    currency: 'usd', // IMPORTANT: Keep this consistent
                    product_data: {
                        name: item.name,
                        images: item.image ? [item.image] : undefined,
                    },
                    unit_amount: unitAmountInCents, 
                },
                quantity: item.quantity,
            };
        });

        // --- 3c. Stripe Session Creation ---
        const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            customer_email: userEmail, 
            
            // Your success/cancel URLs need to be absolute and accessible by Stripe
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart`,
            
            // Crucial: Metadata links the session back to your user/order
            metadata: {
                userId: userId.toString(), 
            }
        });

        // --- 3d. Success Response ---
        res.json({ 
            sessionId: session.id,
            url: session.url,
            message: 'Checkout session created successfully.'
        });

    } catch (error) {
        // --- 3e. Robust Error Handling ---
        console.error('Stripe checkout error:', error);
        
        res.status(500).json({ 
            message: 'Payment session creation failed',
            error: error.message,
            stripeCode: error.code || null 
        });
    }
});

// @route   GET /api/payment/verify/:sessionId
// @desc    Verify payment status after redirect (A basic check, webhooks are better)
// @access  Private 
router.get('/verify/:sessionId', protect, async (req, res) => {
    try {
        if (!stripeInstance) {
            return res.status(500).json({ message: 'Payment service not configured' });
        }

        const sessionId = req.params.sessionId;
        const session = await stripeInstance.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            // You would typically update the Order model here
            res.json({ status: 'paid', orderId: session.metadata.orderId || 'N/A' });
        } else {
            res.status(400).json({ status: session.payment_status });
        }

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ message: 'Verification failed', error: error.message });
    }
});

module.exports = router;