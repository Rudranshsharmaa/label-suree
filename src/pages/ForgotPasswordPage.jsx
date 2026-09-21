import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { FormInput } from '../components/forms/FormInput';
import { Button } from '../components/common/Button';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.auth.forgotPassword(email);
      setSuccessMsg(res.message);
    } catch (err) {
      setError(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
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
            Reset your password
          </h2>
          <p className="text-xs text-[#68736B]">
            Enter your email and we'll send you recovery instructions.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/15 shadow-soft space-y-5">
          {successMsg ? (
            <div className="p-4 rounded-2xl bg-[#DCE8D8] border border-[#2E6847]/30 text-xs text-[#123C2A] space-y-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-[#347A4D] mx-auto" />
              <p className="font-bold">{successMsg}</p>
              <p className="text-[#68736B]">Please check your inbox to proceed with setting a new password.</p>
              <div className="pt-2">
                <Link to="/login">
                  <Button size="sm" variant="primary" fullWidth>
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-2xl bg-[#FBEBEB] border border-[#B94A48]/30 flex items-start gap-2.5 text-xs text-[#B94A48]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <FormInput
                label="Account Email"
                id="reset-email"
                type="email"
                required
                icon={Mail}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                className="font-bold shadow-md"
              >
                Send Recovery Link
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-[#68736B]">
          <Link to="/login" className="inline-flex items-center gap-1 font-bold text-[#123C2A] hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
