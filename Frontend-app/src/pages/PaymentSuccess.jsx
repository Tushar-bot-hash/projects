import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Loader2, XCircle, Home } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://anime-api-backend-u42d.onrender.com/api';

export default function PaymentSuccess() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      const sessionId = searchParams.get('session_id');

      if (!sessionId) {
        setError('Invalid payment session');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/payment/verify/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setOrder(data.order);
        toast.success('Payment successful!');
      } else {
        setError(data.message || 'Payment verification failed');
      }
    } catch (err) {
      setError('Failed to verify payment');
      console.error('Payment verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Verifying your payment...</p>
          <p className="text-gray-400 text-sm mt-2">Please don't close this window</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4">
        <div className="bg-black/40 backdrop-blur-lg rounded-2xl border border-red-500/30 p-12 max-w-md w-full text-center">
          <XCircle className="w-20 h-20 text-red-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">Payment Failed</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/cart')}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Return to Cart
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-6 py-3 bg-black/50 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-black/70 transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4">
      <div className="bg-black/40 backdrop-blur-lg rounded-2xl border border-purple-500/30 p-8 md:p-12 max-w-2xl w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500/20 border-4 border-green-500 rounded-full mb-6 animate-bounce">
            <CheckCircle className="w-16 h-16 text-green-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Payment Successful!
          </h1>
          <p className="text-gray-400 text-lg md:text-xl">
            Thank you for your purchase! 🎉
          </p>
        </div>

        {/* Order Details */}
        {order && (
          <div className="bg-black/30 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl md:text-2xl font-semibold text-white">Order Details</h2>
            </div>
            
            <div className="space-y-3 mb-4 text-sm md:text-base">
              <div className="flex justify-between">
                <span className="text-gray-400">Order ID:</span>
                <span className="text-white font-mono">#{order._id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Order Date:</span>
                <span className="text-white">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-yellow-400 font-semibold capitalize">
                  {order.orderStatus}
                </span>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-t border-purple-500/30 pt-4 space-y-3 max-h-64 overflow-y-auto">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 bg-black/30 p-3 rounded-lg">
                  <img 
                    src={item.image || 'https://via.placeholder.com/50'} 
                    alt={item.name}
                    className="w-12 h-12 md:w-16 md:h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm md:text-base truncate">{item.name}</p>
                    <p className="text-gray-400 text-xs md:text-sm">
                      ${item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-purple-400 font-semibold text-sm md:text-base">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-purple-500/30 mt-4 pt-4 flex justify-between items-center">
              <span className="text-white font-semibold text-lg md:text-xl">Total Amount:</span>
              <span className="text-2xl md:text-3xl font-bold text-purple-400">
                ${order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Confirmation Message */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <p className="text-blue-400 text-sm md:text-base">
            📧 A confirmation email has been sent to your registered email address with order details and tracking information.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition transform hover:scale-105"
          >
            <Package className="w-5 h-5" />
            View My Orders
          </button>
          <button
            onClick={() => navigate('/products')}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-black/50 border border-purple-500/30 text-purple-400 font-semibold rounded-lg hover:bg-black/70 transition"
          >
            Continue Shopping
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Home Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-purple-400 transition flex items-center gap-2 mx-auto"
          >
            <Home className="w-4 h-4" />
            <span>Back to Homepage</span>
          </button>
        </div>
      </div>
    </div>
  );
}