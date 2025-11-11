import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, MapPin, CreditCard, Truck, CheckCircle, X } from 'lucide-react';
import Loading from '../components/common/Loading';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://anime-api-backend-u42d.onrender.com/api';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Order not found');
      }

      const data = await response.json();
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Order not found');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/orders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      toast.success('Order cancelled successfully');
      fetchOrder();
    } catch (error) {
      toast.error(error.message || 'Failed to cancel order');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-50',
      processing: 'text-blue-600 bg-blue-50',
      shipped: 'text-purple-600 bg-purple-50',
      delivered: 'text-green-600 bg-green-50',
      cancelled: 'text-red-600 bg-red-50'
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const getStatusSteps = (currentStatus) => {
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: Package },
      { key: 'processing', label: 'Processing', icon: Package },
      { key: 'shipped', label: 'Shipped', icon: Truck },
      { key: 'delivered', label: 'Delivered', icon: CheckCircle }
    ];

    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex
    }));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <Loading fullScreen />;
  if (!order) return null;

  const canCancel = ['pending', 'processing'].includes(order.orderStatus);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        <div className="mb-6">
          <button onClick={() => navigate('/orders')} className="text-primary-600 hover:underline mb-2">
            ← Back to Orders
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-display font-bold">Order Details</h1>
            {canCancel && (
              <button onClick={handleCancelOrder} className="btn btn-outline text-red-600 border-red-600">
                Cancel Order
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Order Status</h2>
                <span className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(order.orderStatus)}`}>
                  {order.orderStatus.toUpperCase()}
                </span>
              </div>

              {order.orderStatus !== 'cancelled' && (
                <div className="relative">
                  <div className="flex justify-between">
                    {getStatusSteps(order.orderStatus).map((step, index) => (
                      <div key={step.key} className="flex flex-col items-center flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                          step.completed ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'
                        }`}>
                          <step.icon size={24} />
                        </div>
                        <div className={`text-sm font-medium text-center ${
                          step.completed ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-10">
                    <div
                      className="h-full bg-primary-600 transition-all"
                      style={{ width: `${(getStatusSteps(order.orderStatus).filter(s => s.completed).length - 1) * 33.33}%` }}
                    />
                  </div>
                </div>
              )}

              {order.trackingNumber && (
                <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                  <div className="font-semibold mb-1">Tracking Number:</div>
                  <div className="text-blue-600 font-mono">{order.trackingNumber}</div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Order Items</h2>
              <div className="space-y-4">
                {/* Support both old format (orderItems) and new format (items) */}
                {(order.items || order.orderItems || []).map((item) => (
                  <div key={item._id} className="flex gap-4 pb-4 border-b last:border-0">
                    <img
                      src={item.image || 'https://via.placeholder.com/80'}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.name}</h3>
                      <div className="text-sm text-gray-600">
                        {item.size && <span className="mr-3">Size: {item.size}</span>}
                        {item.color && <span>Color: {item.color}</span>}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Qty: {item.quantity} × ₹{item.price}
                      </div>
                    </div>
                    <div className="font-bold">₹{(item.quantity * item.price).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="card">
              <h2 className="text-lg font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID</span>
                  <span className="font-mono">#{order._id.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                {/* Support both old format (itemsPrice, shippingPrice, taxPrice) and new format (totalAmount only) */}
                {order.itemsPrice !== undefined ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>₹{order.itemsPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span>₹{order.shippingPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span>₹{order.taxPrice.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount</span>
                    <span>₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary-600">
                    ₹{(order.totalPrice || order.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="card">
              <div className="flex items-center mb-3">
                <MapPin size={20} className="text-gray-600 mr-2" />
                <h2 className="text-lg font-bold">Shipping Address</h2>
              </div>
              <div className="text-sm text-gray-700">
                {order.shippingAddress ? (
                  <>
                    <p>{order.shippingAddress.fullName || 'N/A'}</p>
                    {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
                    {order.shippingAddress.address && <p>{order.shippingAddress.address}</p>}
                    <p>
                      {order.shippingAddress.city && `${order.shippingAddress.city}, `}
                      {order.shippingAddress.state}
                    </p>
                    <p>{order.shippingAddress.zipCode}</p>
                    {order.shippingAddress.phone && (
                      <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
                    )}
                    {order.shippingAddress.email && (
                      <p>Email: {order.shippingAddress.email}</p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500">Address information not available</p>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="card">
              <div className="flex items-center mb-3">
                <CreditCard size={20} className="text-gray-600 mr-2" />
                <h2 className="text-lg font-bold">Payment Method</h2>
              </div>
              <div className="text-sm">
                <div className="capitalize mb-2">{order.paymentMethod || 'stripe'}</div>
                <span className={`badge ${
                  (order.isPaid || order.paymentStatus === 'paid') ? 'badge-success' : 'badge-warning'
                }`}>
                  {(order.isPaid || order.paymentStatus === 'paid') ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;