const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose'); // 🆕 Import mongoose for ObjectId

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

// 🆕 FIXED: Temporary middleware with valid ObjectId
const tempAuthMiddleware = (req, res, next) => {
    console.log('Temp auth middleware - allowing request');
    // Use a valid ObjectId instead of string
    req.user = { id: new mongoose.Types.ObjectId() }; // 🆕 Creates a valid ObjectId
    next();
};

// 🆕 SIMPLIFIED VERSION: Create checkout session without cart lookup
router.post('/create-checkout-session', tempAuthMiddleware, async (req, res) => {
    try {
        console.log('Create checkout session called');
        
        // 🆕 Use line items from request body instead of cart lookup
        const { cartItems, totalAmount } = req.body;
        
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        console.log('Received cart items:', cartItems);

        // 🆕 Create line items from request data
        const lineItems = cartItems.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name || 'Anime Product',
                    description: item.description || 'Awesome anime merchandise',
                    images: item.image ? [item.image] : [],
                },
                unit_amount: Math.round((item.price || 10) * 100), // 🆕 Fallback price
            },
            quantity: item.quantity || 1,
        }));

        console.log('Processed line items:', lineItems);

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart`,
            metadata: {
                userId: req.user.id.toString(),
                cartData: JSON.stringify(cartItems) // 🆕 Store cart data in metadata
            }
        });

        res.json({ 
            success: true,
            sessionId: session.id,
            url: session.url 
        });

    } catch (error) {
        console.error('Stripe checkout error:', error);
        res.status(500).json({ 
            message: 'Payment session creation failed',
            error: error.message 
        });
    }
});

// Test route - ALWAYS WORKS
router.get('/test', (req, res) => {
    console.log('✅ Payment test route hit!');
    res.json({ 
        success: true, 
        message: 'Payment routes are working!',
        models: {
            auth: !!authMiddleware,
            order: !!Order,
            cart: !!Cart
        }
    });
});

// @route   POST /api/payment/webhook
// @desc    Stripe webhook to handle successful payments
// @access  Public (but verified by Stripe signature)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    console.log('Webhook received');
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('Stripe webhook secret not configured');
        return res.status(500).json({ message: 'Webhook not configured' });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);

        try {
            // 🆕 Create order from metadata instead of cart lookup
            const cartData = JSON.parse(session.metadata.cartData || '[]');
            
            if (!Order) {
                console.log('Order model not available, skipping order creation');
                return res.json({ received: true, message: 'Webhook received but order model not available' });
            }

            // Create order from cart data in metadata
            const order = new Order({
                user: new mongoose.Types.ObjectId(), // 🆕 Create new user ID
                items: cartData.map(item => ({
                    product: item.productId || new mongoose.Types.ObjectId(),
                    name: item.name || 'Anime Product',
                    price: item.price || 10,
                    quantity: item.quantity || 1,
                    image: item.image || ''
                })),
                totalAmount: session.amount_total / 100, // Convert from cents
                paymentStatus: 'paid',
                paymentMethod: 'stripe',
                stripeSessionId: session.id,
                shippingAddress: {
                    fullName: session.customer_details?.name || 'Customer',
                    email: session.customer_details?.email || 'customer@example.com'
                }
            });

            await order.save();
            console.log('Order created successfully:', order._id);

        } catch (error) {
            console.error('Error processing payment webhook:', error);
            // Don't return error to Stripe, just log it
        }
    }

    res.json({ received: true });
});

// @route   GET /api/payment/verify/:sessionId
// @desc    Verify payment session after redirect
// @access  Private
router.get('/verify/:sessionId', tempAuthMiddleware, async (req, res) => {
    try {
        console.log('Verify payment called for session:', req.params.sessionId);
        const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

        if (session.payment_status === 'paid') {
            // Skip order lookup if model not available
            if (!Order) {
                return res.json({
                    success: true,
                    message: 'Payment successful! (Order model not available)',
                    session: session
                });
            }

            // Find the order created by webhook
            const order = await Order.findOne({ 
                stripeSessionId: session.id 
            });

            res.json({
                success: true,
                order: order,
                message: 'Payment successful!'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment not completed'
            });
        }

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ 
            message: 'Payment verification failed',
            error: error.message 
        });
    }
});

console.log('Payment routes configured successfully');
module.exports = router;