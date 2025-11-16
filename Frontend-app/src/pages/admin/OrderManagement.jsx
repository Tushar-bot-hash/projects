import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit } from 'lucide-react';
import { orderAPI } from '../../services/api';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getAllOrders();
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderAPI.updateOrderStatus(orderId, { orderStatus: newStatus });
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Fix for product name display
  const formatProductName = (name) => {
    if (!name) return 'Unknown Product';
    return name.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.orderStatus === filterStatus);

  if (loading) return <Loading fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container-custom py-6">
          <h1 className="text-3xl font-display font-bold">Order Management</h1>
          <p className="text-gray-600 mt-2">Manage and track all customer orders</p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Filter Tabs */}
        <div className="card mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium capitalize whitespace-nowrap transition-colors ${
                  filterStatus === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table - FIXED LAYOUT */}
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 min-w-[120px]">Order ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 min-w-[150px]">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 min-w-[100px]">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 min-w-[120px]">Products</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 min-w-[100px]">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 min-w-[140px]">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 min-w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                  {/* Order ID */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm text-gray-900 font-medium">
                      #{order._id?.slice(-8) || 'N/A'}
                    </span>
                  </td>
                  
                  {/* Customer Info */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">
                        {order.user?.name || 'Unknown Customer'}
                      </div>
                      <div className="text-sm text-gray-600 truncate max-w-[140px]">
                        {order.user?.email || 'No email'}
                      </div>
                    </div>
                  </td>
                  
                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(order.createdAt)}
                    </div>
                  </td>
                  
                  {/* Product Images with Names */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {order.orderItems?.slice(0, 3).map((item, index) => (
                          <img
                            key={index}
                            src={item.image}
                            alt={item.name}
                            className="w-8 h-8 rounded-full border-2 border-white object-cover"
                            title={formatProductName(item.name)}
                          />
                        ))}
                        {order.orderItems?.length > 3 && (
                          <div 
                            className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600"
                            title={`${order.orderItems.length - 3} more items`}
                          >
                            +{order.orderItems.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">
                        {order.orderItems?.length || 0} items
                      </div>
                    </div>
                  </td>
                  
                  {/* Total Amount */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900">
                        ₹{(order.totalPrice || 0).toFixed(2)}
                      </div>
                      <div className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        order.isPaid 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {order.isPaid ? 'Paid' : 'Unpaid'}
                      </div>
                    </div>
                  </td>
                  
                  {/* Status Dropdown */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.orderStatus || 'pending'}
                      onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full border-0 focus:ring-2 focus:ring-primary-500 cursor-pointer transition-colors ${
                        getStatusColor(order.orderStatus)
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  
                  {/* Actions */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Link
                      to={`/orders/${order._id}`}
                      className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                      title="View Order Details"
                    >
                      <Eye size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              <div className="text-lg font-medium mb-2">No orders found</div>
              <div className="text-sm text-gray-500">
                {filterStatus === 'all' 
                  ? 'No orders in the system yet.' 
                  : `No orders with status "${filterStatus}".`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;