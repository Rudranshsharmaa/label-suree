import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  LogOut, 
  History, 
  Settings, 
  ShieldCheck, 
  ChevronDown 
} from 'lucide-react';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.fullName
    ? user.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-[#FAF9F5] border border-[#123C2A]/15 hover:border-[#123C2A]/30 transition-all text-left focus-visible:outline-[#123C2A]"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 rounded-lg bg-[#123C2A] text-[#F5F3EA] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
          {initials}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-xs font-bold text-[#17231C] leading-tight truncate max-w-[120px]">
            {user.fullName || 'User'}
          </p>
          <p className="text-[10px] text-[#68736B] truncate max-w-[120px]">
            {user.role || 'Compliance Reviewer'}
          </p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#68736B] hidden sm:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#FAF9F5] border border-[#123C2A]/15 shadow-medium py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-2.5 border-b border-[#123C2A]/10">
            <p className="text-xs font-bold text-[#17231C]">{user.fullName}</p>
            <p className="text-[11px] text-[#68736B] truncate">{user.email}</p>
            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-[#DCE8D8] text-[10px] font-semibold text-[#123C2A]">
              <ShieldCheck className="w-3 h-3" />
              {user.organization || 'Verified Auditor'}
            </span>
          </div>

          <div className="py-1">
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#17231C] hover:bg-[#E9E8DC] transition-colors"
            >
              <User className="w-4 h-4 text-[#123C2A]" />
              Dashboard Overview
            </Link>
            <Link
              to="/history"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#17231C] hover:bg-[#E9E8DC] transition-colors"
            >
              <History className="w-4 h-4 text-[#123C2A]" />
              12-Month Scan History
            </Link>
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#17231C] hover:bg-[#E9E8DC] transition-colors"
            >
              <Settings className="w-4 h-4 text-[#123C2A]" />
              Profile & Preferences
            </Link>
          </div>

          <div className="border-t border-[#123C2A]/10 pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#B94A48] hover:bg-[#FBEBEB] transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
