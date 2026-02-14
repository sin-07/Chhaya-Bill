'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Shield, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

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
    // Auto-focus first input
    document.getElementById('code-0')?.focus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        credentials: 'include'
      });
      if (response.ok) {
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
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

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
    
    const nextEmptyIndex = newCode.findIndex(c => !c);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    document.getElementById(`code-${focusIndex}`)?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) return;

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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: fullCode }),
      });

      const data = await response.json();

      if (response.ok) {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-xl shadow-neutral-200/30 border border-neutral-100 p-10 text-center">
            <div
              className="w-20 h-20 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-2xl flex items-center justify-center mx-auto mb-8 cursor-pointer hover:from-neutral-200 hover:to-neutral-300 transition-all duration-300"
              onClick={handleUnlockClick}
              title={unlockClicks > 0 ? `${5 - unlockClicks} more clicks to unlock` : ''}
            >
              <AlertCircle className="w-9 h-9 text-neutral-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-3">Access Blocked</h1>
            <p className="text-neutral-500 leading-relaxed mb-8">{blockMessage}</p>
            <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200">
              <p className="text-sm text-neutral-600">
                If you believe this is an error, please contact the system administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filledCount = code.filter(d => d).length;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-100/50 px-4 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-neutral-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-neutral-100/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-md w-full relative z-10">
        {/* Back link */}
        <a href="/" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-700 transition-colors mb-10 group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to home
        </a>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-neutral-200/60 shadow-xl shadow-neutral-200/40 p-10">
          {/* Logo & Header */}
          <div className="text-center mb-10">
            <div className="relative w-20 h-20 mx-auto mb-5 rounded-2xl overflow-hidden shadow-lg shadow-neutral-200/50 ring-1 ring-neutral-100">
              <Image
                src="/logoC.jpeg"
                alt="Chhaya Printing Solution Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Welcome Back</h1>
            <p className="text-sm text-neutral-400 mt-2">Enter your 6-digit access code</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Code Inputs */}
            <div>
              <div className="flex gap-3 justify-center" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-2xl border-2 transition-all duration-200 outline-none
                      ${digit 
                        ? 'border-neutral-900 bg-neutral-50 text-neutral-900 shadow-sm shadow-neutral-200' 
                        : 'border-neutral-200 bg-neutral-50/80 text-neutral-900 hover:border-neutral-300'}
                      focus:border-neutral-900 focus:bg-white focus:ring-4 focus:ring-neutral-900/10 focus:shadow-sm`}
                    disabled={loading}
                    autoComplete="off"
                  />
                ))}
              </div>
              {/* Progress indicator */}
              <div className="flex justify-center gap-1.5 mt-4">
                {code.map((digit, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      digit ? 'w-5 bg-neutral-900' : 'w-2 bg-neutral-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-neutral-50 border border-neutral-300 rounded-2xl px-5 py-4 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 text-neutral-700" />
                </div>
                <span className="text-sm text-neutral-700 leading-relaxed">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || code.some(d => !d)}
              className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2.5
                ${loading || code.some(d => !d)
                  ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                  : 'bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.98] shadow-lg shadow-neutral-900/20 hover:shadow-xl hover:shadow-neutral-900/25'
                }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-4.5 h-4.5" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-neutral-400">
            Protected by secure authentication
          </p>
          <p className="text-xs text-neutral-300">
            3 failed attempts will lock access
          </p>
        </div>
      </div>
    </div>
  );
}
