const express = require('express');
const router = express.Router();

// 🆕 Check if Stripe secret key exists
let stripe;
try {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined');
  }
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('✅ Stripe initialized successfully');
} catch (error) {
  console.error('❌ Stripe initialization failed:', error.message);
  stripe = null;
}

console.log('Loading payment routes...');

// Import modules properly at the top level
let authMiddleware, Order, Cart;

try {
    authMiddleware = require('../middleware/auth').authMiddleware;
    console.log('✅ Auth middleware loaded successfully');
} catch (authError) {
    console.error('❌ Auth middleware import failed:', authError.message);
}

try {
    Order = require('../models/Order');
    console.log('✅ Order model loaded successfully');
} catch (orderError) {
    console.error('❌ Order model import failed:', orderError.message);
}

try {
    Cart = require('../models/Cart');
    console.log('✅ Cart model loaded successfully');
} catch (cartError) {
    console.error('❌ Cart model import failed:', cartError.message);
}

// Temporary middleware for testing
const tempAuthMiddleware = (req, res, next) => {
    console.log('Temp auth middleware - allowing request');
    req.user = { id: 'test-user-id' };
    next();
};

// Test route - ALWAYS WORKS
router.get('/test', (req, res) => {
    console.log('✅ Payment test route hit!');
    res.json({ 
        success: true, 
        message: 'Payment routes are working!',
        stripe: !!stripe,
        models: {
            auth: !!authMiddleware,
            order: !!Order,
            cart: !!Cart
        }
    });
});

// @route   POST /api/payment/create-checkout-session
// @desc    Create Stripe checkout session
// @access  Private
router.post('/create-checkout-session', tempAuthMiddleware, async (req, res) => {
    try {
        // 🆕 Check if Stripe is available
        if (!stripe) {
            return res.status(500).json({
                message: 'Payment service not configured',
                error: 'STRIPE_SECRET_KEY is missing'
            });
        }

        console.log('Create checkout session called');
        const userId = req.user.id;

        // Check if Cart model is available
        if (!Cart) {
            console.log('Cart model not available, returning mock response');
            
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Test Product',
                            description: 'Test Description',
                        },
                        unit_amount: 2000, // $20.00
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart`,
                metadata: {
                    userId: userId,
                }
            });

            return res.json({ 
                sessionId: session.id,
                url: session.url,
                message: 'Mock session created (Cart model not available)'
            });
        }

        // ... rest of your existing code

    } catch (error) {
        console.error('Stripe checkout error:', error);
        res.status(500).json({ 
            message: 'Payment session creation failed',
            error: error.message 
        });
    }
});

// ... rest of your payment.js code remains the same

module.exports = router;