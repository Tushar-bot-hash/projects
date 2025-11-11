import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import Loading from '../components/common/Loading';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://anime-api-backend-u42d.onrender.com';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      // 🆕 FIXED: Added /api to the URL
      const response = await fetch(`${API_URL}/api/orders/myorders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'badge-warning',
      processing: 'badge-info',
      shipped: 'badge-info',
      delivered: 'badge-success',
      cancelled: 'badge-danger'
    };
    return colors[status] || 'badge-info';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-display font-bold mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="card text-center py-12">
            <Package size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">Start shopping to see your orders here!</p>
            <Link to="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order._id}
                to={`/orders/${order._id}`}
                className="card hover:shadow-lg transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold">Order #{order._id?.slice(-8)}</span>
                      <span className={`badge ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      <div>Placed on {formatDate(order.createdAt)}</div>
                      <div>
                        {(order.items || order.orderItems || []).length} item(s)
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {(order.items || order.orderItems || []).slice(0, 3).map((item, index) => (
                        <img
                          key={index}
                          src={item.image || 'https://via.placeholder.com/64'}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      ))}
                      {(order.items || order.orderItems || []).length > 3 && (
                        <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-sm text-gray-600">
                          +{(order.items || order.orderItems).length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Total & Action */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total</div>
                      <div className="text-xl font-bold">
                        ₹{(order.totalPrice || order.totalAmount || 0).toFixed(2)}
                      </div>
                    </div>
                    <ChevronRight className="text-gray-400" size={24} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;