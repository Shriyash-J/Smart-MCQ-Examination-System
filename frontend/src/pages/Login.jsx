import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  CheckCircleIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const emailInputRef = useRef(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
    emailInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const newErrors = {};
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
  }, [formData]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Minimum 6 characters';
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Login failed. Please try again.';
      toast.error(errorMsg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Panel - Solid dark background with gradient overlay (guaranteed visible) */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-purple-700 via-purple-800 to-pink-700 p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Animated gradient blobs - purely decorative */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 -left-20 w-80 h-80 bg-white rounded-full blur-2xl animate-pulse" />
            <div className="absolute bottom-40 right-10 w-96 h-96 bg-purple-400 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-yellow-400 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>

          <div className="relative z-10">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-lg">SmartMCQ</h1>
            <p className="text-white/95 text-lg lg:text-xl max-w-md leading-relaxed drop-shadow">
              Intelligent assessment platform for modern education
            </p>
          </div>

          <div className="relative z-10 space-y-6 my-8">
            <h3 className="text-white/90 text-lg font-medium uppercase tracking-wider drop-shadow">Why choose us</h3>
            <ul className="space-y-4">
              {[
                { title: 'AI-Powered Proctoring', desc: 'Face detection and activity monitoring' },
                { title: 'Multiple Question Types', desc: 'MCQ, MSQ, Diagram, Manual & more' },
                { title: 'Detailed Analytics', desc: 'Comprehensive performance insights' }
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 group transition-transform hover:translate-x-2">
                  <CheckCircleIcon className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5 drop-shadow" />
                  <div>
                    <p className="text-white font-medium drop-shadow">{feature.title}</p>
                    <p className="text-white/85 text-sm drop-shadow">{feature.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg">
              <p className="text-white italic text-lg drop-shadow-md">
                “SmartMCQ has transformed how we conduct assessments. The proctoring features give us confidence in remote exams.”
              </p>
              <p className="text-white/85 mt-3 drop-shadow">— Eng. Vaishali Joshi, Academic Director</p>
            </div>
          </div>

          <div className="relative z-10 text-white/60 text-sm drop-shadow mt-8">
            © 2026 SmartMCQ. All rights reserved.
          </div>
        </div>

        {/* Right Panel - Clean white form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8 bg-white">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-600 mt-2">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className={`space-y-5 ${shake ? 'animate-shake' : ''}`}>
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative group">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    ref={emailInputRef}
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200
                      ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-200 focus:border-indigo-400'}`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative group">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200
                      ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-200 focus:border-indigo-400'}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Options */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => toast('Password reset link sent to your email', { icon: '📧' })}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Button - now clearly visible */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-600 font-medium hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Simple animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </>
  );
};

export default Login;