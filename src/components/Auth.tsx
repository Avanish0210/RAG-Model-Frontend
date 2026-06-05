import React, { useState, useEffect } from 'react';
import { RAGMockBackend } from '../utils/mockBackend';
import { User } from '../types';
import { Shield, Key, User as UserIcon, Check, AlertTriangle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Starburst } from '../App';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation and Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle toggle logic
  const handleToggle = () => {
    setIsLogin(!isLogin);
    setUsername('');
    setName('');
    setPassword('');
    setError(null);
    setSuccess(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic Validation
    if (!username.trim() || !password.trim()) {
      setError('Please provide your username and password.');
      return;
    }

    if (!isLogin && !name.trim()) {
      setError('Please provide your display name.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const res = await RAGMockBackend.login(username, password);
        if (res.success) {
          const activeUser = RAGMockBackend.getCurrentUser();
          if (activeUser) {
            onAuthSuccess(activeUser);
          }
        } else {
          setError(res.error || 'Access denied: Please verify your credentials.');
        }
      } else {
        const res = await RAGMockBackend.signup(username, name, password);
        if (res.success) {
          setSuccess('Account created successfully! Switching to sign in...');
          setTimeout(() => {
            setIsLogin(true);
            setPassword('');
            setSuccess(null);
          }, 1500);
        } else {
          setError(res.error || 'Unable to create account.');
        }
      }
    } catch (err: any) {
      setError('Unable to authenticate at this time. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] px-4 py-12 selection:bg-[#EAE8E3]" id="auth-screen">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-stone-200/70 p-8 sm:p-10 shadow-sm relative overflow-hidden transition-all">
        
        {/* Sleek Starburst Logo Header */}
        <div className="flex flex-col items-center justify-center mb-8" id="auth-logo-header">
          <div className="w-16 h-16 rounded-full border border-stone-200 flex items-center justify-center mb-4 bg-stone-50 hover:border-stone-400 transition-all duration-300">
            <Starburst className="w-9 h-9 text-stone-900" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 text-center font-sans">
            Standard RAG Platform
          </h2>
          <p className="text-[10px] font-mono text-stone-450 tracking-widest uppercase mt-1 font-semibold">
            SECURE LIBRARY SYSTEM
          </p>
        </div>

        {/* Title Toggle section */}
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-stone-150" id="auth-toggle-tab">
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold text-stone-900 font-sans">
              {isLogin ? 'Sign In' : 'Register'}
            </h1>
            <p className="text-[11px] text-stone-450 font-sans">
              {isLogin 
                ? 'Welcome back to your workspace' 
                : 'Configure your local search space'}
            </p>
          </div>
          <button 
            type="button"
            onClick={handleToggle}
            className="text-xs font-bold text-stone-800 hover:underline cursor-pointer"
            id="toggle-auth-btn"
          >
            {isLogin ? 'Create account' : 'Verify credentials'}
          </button>
        </div>

        {/* Notifications and messages */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-700 text-xs flex items-start gap-2.5 animate-fade-in border border-red-100" id="auth-error-msg">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="font-sans leading-relaxed">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-55/60 text-emerald-800 text-xs flex items-start gap-2.5 animate-fade-in border border-emerald-100" id="auth-success-msg">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
            <div className="font-sans leading-relaxed">{success}</div>
          </div>
        )}

        {/* Action form */}
        <form onSubmit={handleAuth} className="space-y-5" id="auth-gateway-form">
          
          <div className="space-y-1.5" id="username-field-container">
            <label className="text-xs font-semibold text-stone-800 block px-1">
              Username Token
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                id="auth-username-input"
                type="text"
                placeholder="e.g. demo or jsmith"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.8 input-neu text-[#2D2C2A]"
                required
              />
            </div>
            {isLogin && (
              <span className="text-[10px] text-stone-400 block px-1 pt-1 font-sans leading-normal">
                Quick Access: Use username <strong className="text-stone-701 font-bold">demo</strong> and password <strong className="text-stone-701 font-bold">demo1234</strong>
              </span>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-1.5 animate-fade-in" id="displayname-field-container">
              <label className="text-xs font-semibold text-stone-800 block px-1">
                Display Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  id="auth-displayname-input"
                  type="text"
                  placeholder="e.g. Olivia Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.8 input-neu text-[#2D2C2A]"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5" id="password-field-container">
            <label className="text-xs font-semibold text-stone-808 block px-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                <Key className="w-4 h-4" />
              </span>
              <input
                id="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-10 py-2.8 input-neu text-[#2D2C2A]"
                required
              />
              <button
                id="auth-password-toggle"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-605 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Action Block */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 btn-neu-accent flex items-center justify-center gap-2 cursor-pointer mt-3"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-stone-200 border-t-stone-800 animate-spin" />
                <span>Decrypting partition...</span>
              </div>
            ) : (
              <span>{isLogin ? 'Sign In to Workspace' : 'Submit Registration'}</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-stone-150 text-center text-[11px] text-stone-400 font-sans tracking-wide">
          All data is isolated client-side inside the local sandbox.
        </div>

      </div>
    </div>
  );
}
