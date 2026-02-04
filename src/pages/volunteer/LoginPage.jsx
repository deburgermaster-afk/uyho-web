import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: enter email, 2: enter new password

  // Check if already logged in and redirect
  useEffect(() => {
    const volunteerId = localStorage.getItem('volunteerId');
    if (volunteerId) {
      navigate('/volunteer', { replace: true });
    }
  }, [navigate]);

  const getErrorIcon = (code) => {
    switch (code) {
      case 'USER_NOT_FOUND':
        return 'person_off';
      case 'WRONG_PASSWORD':
        return 'key_off';
      case 'NETWORK_ERROR':
        return 'wifi_off';
      case 'SERVER_ERROR':
        return 'error';
      default:
        return 'warning';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorCode('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate inputs
      if (!email.trim()) {
        setError('Email is required');
        setErrorCode('MISSING_FIELDS');
        setLoading(false);
        return;
      }

      if (!password) {
        setError('Password is required');
        setErrorCode('MISSING_FIELDS');
        setLoading(false);
        return;
      }

      // Call login endpoint
      const response = await fetch('/api/volunteers/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorCode(data.code || 'UNKNOWN');
        throw new Error(data.error || 'Login failed. Please try again.');
      }

      // Store user data in localStorage
      localStorage.setItem('volunteerId', data.id);
      localStorage.setItem('volunteerEmail', data.email);
      localStorage.setItem('volunteerName', data.full_name);
      localStorage.setItem('volunteerDigitalId', data.digital_id);

      setSuccess('Login successful! Redirecting...');
      
      // Redirect to volunteer profile/dashboard
      setTimeout(() => {
        navigate('/volunteer');
      }, 1000);
    } catch (err) {
      // Check for network error
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error. Please check your internet connection.');
        setErrorCode('NETWORK_ERROR');
      } else {
        setError(err.message || 'An error occurred during login. Please try again.');
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <span className="material-symbols-outlined">chevron_left</span>
            <span className="text-sm font-semibold">Back</span>
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Volunteer Login</h1>
          <div className="w-24"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-8 min-h-[calc(100vh-60px)]">
        <div className="w-full max-w-md">
          {/* Logo/Branding */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
            <p className="text-gray-600 dark:text-gray-400">Sign in to your volunteer account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-red-500 dark:text-red-400 mt-0.5">
                  {getErrorIcon(errorCode)}
                </span>
                <div>
                  <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
                  {errorCode === 'USER_NOT_FOUND' && (
                    <Link to="/join" className="text-red-600 dark:text-red-400 text-xs underline mt-1 inline-block">
                      Register a new account →
                    </Link>
                  )}
                  {errorCode === 'WRONG_PASSWORD' && (
                    <button className="text-red-600 dark:text-red-400 text-xs underline mt-1">
                      Forgot password?
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-300 text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⟳</span>
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center mt-6 text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/join" className="text-primary hover:underline font-semibold">
              Create one
            </Link>
          </p>

          {/* Forgot Password Link */}
          <p className="text-center mt-4">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary font-medium"
            >
              Forgot your password?
            </button>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-lg">Reset Password</h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetStep(1);
                  setResetEmail('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                  setResetError('');
                  setResetSuccess('');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6">
              {resetStep === 1 ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Enter your email address and we'll verify your account.
                  </p>
                  
                  {resetError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                      {resetError}
                    </div>
                  )}
                  
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white mb-4"
                  />
                  
                  <button
                    onClick={async () => {
                      setResetLoading(true);
                      setResetError('');
                      try {
                        const res = await fetch('/api/volunteers/check-email', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: resetEmail })
                        });
                        const data = await res.json();
                        if (data.exists) {
                          setResetStep(2);
                        } else {
                          setResetError('No account found with this email address.');
                        }
                      } catch (err) {
                        setResetError('Failed to verify email. Please try again.');
                      } finally {
                        setResetLoading(false);
                      }
                    }}
                    disabled={resetLoading || !resetEmail}
                    className="w-full py-3 bg-primary text-white font-bold rounded-lg disabled:opacity-50"
                  >
                    {resetLoading ? 'Verifying...' : 'Continue'}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Enter your new password for <strong>{resetEmail}</strong>
                  </p>
                  
                  {resetError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                      {resetError}
                    </div>
                  )}
                  
                  {resetSuccess && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm">
                      {resetSuccess}
                    </div>
                  )}
                  
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white mb-3"
                  />
                  
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white mb-4"
                  />
                  
                  <button
                    onClick={async () => {
                      if (newPassword.length < 6) {
                        setResetError('Password must be at least 6 characters');
                        return;
                      }
                      if (newPassword !== confirmNewPassword) {
                        setResetError('Passwords do not match');
                        return;
                      }
                      setResetLoading(true);
                      setResetError('');
                      try {
                        const res = await fetch('/api/volunteers/reset-password', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: resetEmail, newPassword })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setResetSuccess('Password reset successful! You can now login.');
                          setTimeout(() => {
                            setShowForgotPassword(false);
                            setResetStep(1);
                            setEmail(resetEmail);
                          }, 2000);
                        } else {
                          setResetError(data.error || 'Failed to reset password');
                        }
                      } catch (err) {
                        setResetError('Failed to reset password. Please try again.');
                      } finally {
                        setResetLoading(false);
                      }
                    }}
                    disabled={resetLoading || !newPassword || !confirmNewPassword}
                    className="w-full py-3 bg-primary text-white font-bold rounded-lg disabled:opacity-50"
                  >
                    {resetLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                  
                  <button
                    onClick={() => setResetStep(1)}
                    className="w-full mt-3 py-2 text-gray-600 dark:text-gray-400 text-sm"
                  >
                    ← Back to email
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
