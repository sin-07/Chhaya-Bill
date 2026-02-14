'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState('');
  const [unlockClicks, setUnlockClicks] = useState(0);
  const router = useRouter();

  useEffect(() => {
    checkBlockStatus();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        credentials: 'include'
      });
      if (response.ok) {
        // User is already logged in, redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      // Not logged in, stay on login page
    }
  };

  const checkBlockStatus = async () => {
    try {
      const response = await fetch('/api/auth/check-block', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.blocked) {
        setIsBlocked(true);
        setBlockMessage('Access permanently blocked. Contact developer to unlock.');
      }
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    if (isBlocked) return;

    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    
    setCode(newCode);
    
    // Focus the next empty input or the last input
    const nextEmptyIndex = newCode.findIndex(c => !c);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    document.getElementById(`code-${focusIndex}`)?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      return;
    }

    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code: fullCode }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to dashboard on successful login
        window.location.href = '/dashboard';
      } else {
        if (data.blocked) {
          setIsBlocked(true);
          setBlockMessage(data.error || 'Access permanently blocked. Contact developer to unlock.');
        } else {
          setError(data.error || 'Invalid code. Please try again.');
          setCode(['', '', '', '', '', '']);
          document.getElementById('code-0')?.focus();
        }
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockClick = async () => {
    const newClicks = unlockClicks + 1;
    setUnlockClicks(newClicks);
    
    if (newClicks >= 5) {
      const secret = prompt('Enter developer unlock key:');
      if (secret) {
        try {
          const res = await fetch(`/api/auth/unlock?secret=${secret}`);
          if (res.ok) {
            alert('Access unlocked successfully!');
            setIsBlocked(false);
            setUnlockClicks(0);
          } else {
            alert('Invalid unlock key');
            setUnlockClicks(0);
          }
        } catch (error) {
          alert('Unlock failed');
          setUnlockClicks(0);
        }
      } else {
        setUnlockClicks(0);
      }
    }
  };

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-red-900 px-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center"
        >
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 cursor-pointer hover:bg-red-200 transition-colors"
            onClick={handleUnlockClick}
            title={unlockClicks > 0 ? `${5 - unlockClicks} more clicks to unlock` : 'Click 5 times to unlock'}
          >
            <AlertCircle className="w-10 h-10 text-red-600" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Blocked</h1>
          <p className="text-gray-600 mb-6">{blockMessage}</p>
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact the system administrator.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 px-4">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 100 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-center mb-8"
        >
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              delay: 0.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative w-20 h-20 mx-auto mb-4"
          >
            <Image
              src="/logoC.jpeg"
              alt="Chhaya Printing Solution Logo"
              fill
              className="object-contain rounded-lg"
              priority
            />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
          <p className="text-gray-600">Enter your 6-digit access code</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex gap-3 justify-center" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <motion.input
                  key={index}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileFocus={{ scale: 1.1 }}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={loading}
                  autoComplete="off"
                />
              ))}
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || code.some(d => !d)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              'Login'
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-blue-600 hover:text-blue-700">
            Back to Home
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>3 unsuccessful attempts will block access</p>
        </div>
      </motion.div>
    </div>
  );
}
