import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/Header'; // ASSUMPTION FIX: Updated path
import Footer from './components/Footer'; // ASSUMPTION FIX: Updated path

// You will likely have some global state or context provider here later
// import { AuthProvider } from './context/AuthContext'; 

/**
 * The main layout component for the application.
 * It provides the persistent structure (Header, Footer) and uses Outlet
 * to render the content of the matched nested routes (Home, Products, etc.).
 */
const App = () => {
  return (
    // <AuthProvider> {/* Add your context provider here if you use one */}
      <div className="flex flex-col min-h-screen">
        {/* The Header (navigation) remains constant */}
        <Header /> 

        {/* The Outlet renders the component for the current route (e.g., <Home />, <Products />) */}
        <main className="flex-grow p-4 md:p-8 bg-gray-50">
          <Outlet /> 
        </main>

        {/* The Footer remains constant */}
        <Footer />
      </div>
    // </AuthProvider>
  );
};

// CRITICAL FIX: This uses the 'export default' which resolves the Render build error.
export default App;