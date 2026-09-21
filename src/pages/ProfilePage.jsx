import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { FormInput } from '../components/forms/FormInput';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import {
  User,
  Mail,
  Building,
  ShieldCheck,
  Check,
  Zap,
  LogOut,
  Trash2,
  AlertTriangle,
  Lock,
  RefreshCw
} from 'lucide-react';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const [saved, setSaved] = useState(false);
  const [quota, setQuota] = useState(null);
  const [quotaLoading, setQuotaLoading] = useState(true);

  // Revoke all sessions state
  const [revoking, setRevoking] = useState(false);
  const [revokeMsg, setRevokeMsg] = useState('');

  // Delete account state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadQuota() {
      try {
        const q = await api.auth.getQuotaStatus();
        setQuota(q);
      } catch (err) {
        console.warn('Could not load quota:', err);
      } finally {
        setQuotaLoading(false);
      }
    }
    loadQuota();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleRevokeAll = async () => {
    setRevoking(true);
    setRevokeMsg('');
    try {
      const res = await api.auth.revokeAllSessions();
      setRevokeMsg(res.message || 'All other sessions have been successfully revoked.');
      setTimeout(() => setRevokeMsg(''), 4000);
    } catch (err) {
      setRevokeMsg(err.message || 'Failed to revoke sessions.');
    } finally {
      setRevoking(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      setDeleteError('Please enter your current password to confirm account deletion.');
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      await api.auth.deleteAccount(deletePassword);
      setDeleteModalOpen(false);
      await logout();
      window.location.href = '/';
    } catch (err) {
      setDeleteError(err.message || 'Incorrect password. Account deletion failed.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="py-8 sm:py-10 space-y-8">
      <ResponsiveContainer maxWidth="max-w-3xl">
        <div className="space-y-1 text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2E6847]">
            Account Management & Security
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#17231C] flex items-center gap-2">
            <User className="w-7 h-7 text-[#123C2A]" />
            User Profile & Controls
          </h1>
          <p className="text-xs sm:text-sm text-[#68736B]">
            Manage auditor credentials, monitor usage quotas, and control session security.
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Details Form */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/15 shadow-soft space-y-6">
            <h2 className="text-base font-bold text-[#17231C] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#123C2A]" />
              Auditor Information
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <FormInput
                label="Full Name"
                defaultValue={user?.fullName || user?.full_name || ''}
                icon={User}
                required
              />

              <FormInput
                label="Registered Email Address"
                defaultValue={user?.email || ''}
                type="email"
                icon={Mail}
                disabled
                helperText="Email is bound to your 12-month regulatory audit trail and cannot be changed directly."
              />

              <FormInput
                label="Organization / Company"
                defaultValue={user?.organization || 'LabelSure Verification Labs'}
                icon={Building}
              />

              <FormInput
                label="Auditor Role"
                defaultValue={user?.role || 'Compliance Reviewer'}
                icon={ShieldCheck}
              />

              <div className="pt-2">
                <Button type="submit" variant="primary" size="md" icon={Check} className="font-bold">
                  {saved ? 'Changes Saved!' : 'Save Profile Details'}
                </Button>
              </div>
            </form>
          </div>

          {/* AI Quotas & Cost Protection Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/15 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#17231C] flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#2E6847]" />
                Analysis Quotas & Cost Protection
              </h2>
              <span className="text-xs font-semibold text-[#2E6847] bg-[#DCE8D8] px-2.5 py-0.5 rounded-full">
                Live Monitoring
              </span>
            </div>
            <p className="text-xs text-[#68736B]">
              Real-time daily and monthly scan limits enforcing Gemini API cost protection and preventing runaway queries.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-[#123C2A]/10 space-y-1">
                <span className="text-[11px] font-bold text-[#68736B]">Daily Scans Remaining</span>
                <p className="text-2xl font-black text-[#17231C]">
                  {quotaLoading ? '...' : (quota?.scans_remaining_today ?? 20)}
                </p>
                <p className="text-[10px] text-[#68736B]">
                  Limit: {quota?.daily_scan_limit ?? 20} scans/day
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#123C2A]/10 space-y-1">
                <span className="text-[11px] font-bold text-[#68736B]">Monthly Scans Used</span>
                <p className="text-2xl font-black text-[#17231C]">
                  {quotaLoading ? '...' : (quota?.scans_used_this_month ?? 0)}
                </p>
                <p className="text-[10px] text-[#68736B]">
                  Monthly Cap: {quota?.monthly_scan_limit ?? 200} scans
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#123C2A]/10 space-y-1">
                <span className="text-[11px] font-bold text-[#68736B]">Global System Health</span>
                <p className="text-2xl font-black text-[#2E6847]">
                  Active
                </p>
                <p className="text-[10px] text-[#68736B]">
                  Max global cap: {quota?.global_daily_limit ?? 1000}/day
                </p>
              </div>
            </div>
          </div>

          {/* Session Security Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/15 shadow-soft space-y-4">
            <h2 className="text-base font-bold text-[#17231C] flex items-center gap-2">
              <LogOut className="w-5 h-5 text-[#123C2A]" />
              Session & Device Security
            </h2>
            <p className="text-xs text-[#68736B]">
              Rotate your cryptographic refresh tokens and terminate all active sessions across all devices and browsers.
            </p>

            {revokeMsg && (
              <div className="p-3 rounded-xl bg-[#DCE8D8] text-[#123C2A] text-xs font-semibold">
                {revokeMsg}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={handleRevokeAll}
              disabled={revoking}
              className="font-bold border-[#123C2A]/30 text-[#17231C] hover:bg-[#E9E8DC]"
            >
              {revoking ? 'Revoking Sessions...' : 'Revoke All Active Sessions'}
            </Button>
          </div>

          {/* Danger Zone: Account Deletion */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FFF5F5] border border-[#E53E3E]/20 shadow-soft space-y-4">
            <div className="flex items-center gap-2 text-[#C53030]">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="text-base font-bold">Danger Zone: Permanent Account Deletion</h2>
            </div>
            <p className="text-xs text-[#742A2A]">
              Deleting your account will permanently delete your auditor credentials, revoke all active sessions, wipe your 12-month scan history, and securely purge all uploaded packaging images from disk. This action is irreversible.
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Trash2}
              onClick={() => {
                setDeletePassword('');
                setDeleteError('');
                setDeleteModalOpen(true);
              }}
              className="font-bold border-[#E53E3E] text-[#C53030] hover:bg-[#FED7D7]"
            >
              Delete Account & Associated Data
            </Button>
          </div>
        </div>
      </ResponsiveContainer>

      {/* Account Deletion Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Permanent Account Deletion"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-[#FFF5F5] border border-[#E53E3E]/20 text-xs text-[#742A2A] space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#C53030]" />
              Irreversible Action Warning
            </p>
            <p>
              Please enter your current account password to authorize cascading deletion of your account, tokens, scan reports, and packaging images.
            </p>
          </div>

          {deleteError && (
            <div className="p-3 rounded-xl bg-[#FED7D7] text-[#9B2C2C] text-xs font-semibold">
              {deleteError}
            </div>
          )}

          <FormInput
            label="Current Password"
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="••••••••••••"
            icon={Lock}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              icon={Trash2}
              disabled={deleting}
              className="bg-[#C53030] text-white hover:bg-[#9B2C2C]"
            >
              {deleting ? 'Deleting Account...' : 'Permanently Delete Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
