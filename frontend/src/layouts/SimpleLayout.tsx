import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';

const SimpleLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background transition-colors">
      <AppHeader />
      <main>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SimpleLayout;
