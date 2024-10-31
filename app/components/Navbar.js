"use client"
import Link from 'next/link';
import { LogOut, LogIn, Home, LayoutDashboard } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if token exists in cookies
    const hasToken = document.cookie.includes('token=');
    setIsLoggedIn(hasToken);
  }, [pathname]); // Re-check when pathname changes

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        setIsLoggedIn(false);
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Hide navbar only on login and register pages
  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (isAuthPage) {
    return null;
  }

  const isActive = (path) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-xl border-b border-white/10 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="text-white font-bold text-xl hover:text-white/80 transition-colors"
            >
              JARVIS.AI
            </Link>
            <Link
              href="/"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 
                ${isActive('/') ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Home size={20} />
              <span>Home</span>
            </Link>
            {isLoggedIn && (
              <Link
                href="/dashboard"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 
                  ${isActive('/dashboard') ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </Link>
            )}
          </div>
          
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-400 
                hover:text-white hover:bg-white/5 transition-all duration-300"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-400 
                hover:text-white hover:bg-white/5 transition-all duration-300"
            >
              <LogIn size={20} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
} 