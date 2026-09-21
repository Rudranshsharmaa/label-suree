import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FormInput } from '../components/forms/FormInput';
import { PasswordInput } from '../components/forms/PasswordInput';
import { Button } from '../components/common/Button';
import { Mail, LogIn, Sparkles, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick helper to fill demo credentials
  const fillDemoUser = (userType = 'rudransh') => {
    if (userType === 'rudransh') {
      setEmail('rudransh@labelsure.io');
      setPassword('Password123!');
    } else {
      setEmail('ananya@agrifoods.in');
      setPassword('Password123!');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#123C2A] p-2 flex items-center justify-center shadow-sm">
              <img src="/logo.svg" alt="LabelSure Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-black text-[#17231C]">
              LabelSure
            </span>
          </Link>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#17231C]">
            Sign in to your account
          </h2>
          <p className="text-xs text-[#68736B]">
            Access your food packaging audits and 12-month scan history.
          </p>
        </div>

        {/* Form Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/15 shadow-soft space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-[#FBEBEB] border border-[#B94A48]/30 flex items-start gap-2.5 text-xs text-[#B94A48]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Email Address"
              id="login-email"
              type="email"
              required
              icon={Mail}
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <PasswordInput
              label="Password"
              id="login-password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[#17231C]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#123C2A]/30 text-[#123C2A] focus:ring-[#123C2A]"
                />
                <span className="font-medium">Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="font-semibold text-[#123C2A] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon={LogIn}
              className="font-bold shadow-md"
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="pt-4 border-t border-[#123C2A]/10 space-y-2">
            <span className="text-[11px] font-bold text-[#68736B] uppercase tracking-wider block text-center">
              Quick One-Click Demo Logins
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoUser('rudransh')}
                className="p-2 text-xs font-semibold rounded-xl bg-[#E9E8DC] hover:bg-[#DCE8D8] text-[#123C2A] transition-colors truncate"
              >
                👤 Rudransh (Lead Auditor)
              </button>
              <button
                type="button"
                onClick={() => fillDemoUser('ananya')}
                className="p-2 text-xs font-semibold rounded-xl bg-[#E9E8DC] hover:bg-[#DCE8D8] text-[#123C2A] transition-colors truncate"
              >
                👤 Ananya (Verma Organics)
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-[#68736B]">
          Don't have an account yet?{' '}
          <Link to="/signup" className="font-bold text-[#123C2A] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
