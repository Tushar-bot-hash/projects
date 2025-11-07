import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * The main layout component for the application.
 * It serves as the top-level wrapper for all nested routes.
 * The non-existent Header and Footer imports have been permanently removed.
 */
const App = () => {
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* The Outlet renders the component for the current route 
          (All your pages: Home, Login, AdminDashboard, etc., load here) */}
      <main className="flex-grow p-4 md:p-8 bg-gray-50">
        <Outlet /> 
      </main>

    </div>
  );
};

// CRITICAL: This default export is required by your main.jsx file.
export default App;