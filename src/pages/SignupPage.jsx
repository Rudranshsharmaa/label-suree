import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FormInput } from '../components/forms/FormInput';
import { PasswordInput } from '../components/forms/PasswordInput';
import { Button } from '../components/common/Button';
import { User, Mail, Building, UserPlus, AlertCircle } from 'lucide-react';

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    if (!agreeTerms) {
      setError('Please accept the Terms of Service & Privacy Policy to continue.');
      return;
    }

    try {
      setLoading(true);
      await signup({ fullName, email, password, organization });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
            Create your account
          </h2>
          <p className="text-xs text-[#68736B]">
            Start auditing packaging compliance and food product nutrition.
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
              label="Full Name"
              id="signup-name"
              required
              icon={User}
              placeholder="e.g., Rudransh Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <FormInput
              label="Work or Personal Email"
              id="signup-email"
              type="email"
              required
              icon={Mail}
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <FormInput
              label="Organization / Brand (Optional)"
              id="signup-org"
              icon={Building}
              placeholder="e.g., Quality Assurance Labs"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />

            <PasswordInput
              label="Password (min 6 characters)"
              id="signup-password"
              required
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <PasswordInput
              label="Confirm Password"
              id="signup-confirm-password"
              required
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-[#17231C]">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded border-[#123C2A]/30 text-[#123C2A] focus:ring-[#123C2A] mt-0.5"
                />
                <span className="leading-snug text-[#68736B]">
                  I understand that LabelSure provides preliminary automated assessments and does not constitute official statutory legal certification.
                </span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon={UserPlus}
              className="font-bold shadow-md"
            >
              Create Account
            </Button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-[#68736B]">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#123C2A] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
