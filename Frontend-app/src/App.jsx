import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import PaymentSuccess from './pages/PaymentSuccess';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ProductManagement from './pages/admin/ProductManagement';
import OrderManagement from './pages/admin/OrderManagement';
import UserManagement from './pages/admin/UserManagement';

// Layout component
const AppLayout = () => {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden w-screen">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <Toaster position="top-right" />
    </div>
  );
};

// Create router with future flags
const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      // Public Routes
      { path: "/", element: <Home /> },
      { path: "/products", element: <Products /> },
      { path: "/products/:id", element: <ProductDetail /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },

      // Protected Routes
      { 
        path: "/cart", 
        element: <ProtectedRoute><Cart /></ProtectedRoute> 
      },
      { 
        path: "/checkout", 
        element: <ProtectedRoute><Checkout /></ProtectedRoute> 
      },
      { 
        path: "/profile", 
        element: <ProtectedRoute><Profile /></ProtectedRoute> 
      },
      { 
        path: "/orders", 
        element: <ProtectedRoute><Orders /></ProtectedRoute> 
      },
      { 
        path: "/orders/:id", 
        element: <ProtectedRoute><OrderDetail /></ProtectedRoute> 
      },
      { 
        path: "/payment-success", 
        element: <ProtectedRoute><PaymentSuccess /></ProtectedRoute> 
      },

      // Admin Routes
      { 
        path: "/admin", 
        element: <AdminRoute><AdminDashboard /></AdminRoute> 
      },
      { 
        path: "/admin/products", 
        element: <AdminRoute><ProductManagement /></AdminRoute> 
      },
      { 
        path: "/admin/orders", 
        element: <AdminRoute><OrderManagement /></AdminRoute> 
      },
      { 
        path: "/admin/users", 
        element: <AdminRoute><UserManagement /></AdminRoute> 
      },
    ],
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  }
});

function App() {
  return <RouterProvider router={router} />;
}

export default App;