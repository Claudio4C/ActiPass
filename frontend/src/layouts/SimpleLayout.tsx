import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';

interface SimpleLayoutProps {
  hideNav?: boolean;
}

const SimpleLayout: React.FC<SimpleLayoutProps> = ({ hideNav }) => (
  <div className="min-h-screen bg-background transition-colors">
    {hideNav ? (
      <header className="flex items-center justify-center h-16 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <Link to="/home" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm shrink-0">
            <span className="text-primary-foreground font-display font-bold text-sm">I</span>
          </div>
          <span className="font-display font-bold text-foreground text-lg">Actipass</span>
        </Link>
      </header>
    ) : (
      <AppHeader />
    )}
    <main>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </div>
    </main>
  </div>
);

export default SimpleLayout;
