'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  Printer
} from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Printer className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">Chhaya Printing Solution</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="/#home" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Home</a>
            <a href="/#services" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Services</a>
            <a href="/#about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">About</a>
            <a href="/#feedback" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Feedback</a>
            {isDashboard ? (
              <Link href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Admin Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-3 space-y-3">
            <a href="/#home" className="block text-gray-700 hover:text-blue-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Home</a>
            <a href="/#services" className="block text-gray-700 hover:text-blue-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Services</a>
            <a href="/#about" className="block text-gray-700 hover:text-blue-600 font-medium" onClick={() => setMobileMenuOpen(false)}>About</a>
            <a href="/#feedback" className="block text-gray-700 hover:text-blue-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Feedback</a>
            {isDashboard ? (
              <Link href="/dashboard" className="block bg-blue-600 text-white px-4 py-2 rounded-lg text-center hover:bg-blue-700">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="block bg-blue-600 text-white px-4 py-2 rounded-lg text-center hover:bg-blue-700">
                Admin Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
