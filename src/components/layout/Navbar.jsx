import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserMenu } from './UserMenu';
import { Button } from '../common/Button';
import { 
  ScanLine, 
  Menu, 
  X, 
  LayoutDashboard, 
  History, 
  ShieldCheck, 
  ActivitySquare,
  Sparkles
} from 'lucide-react';

export function Navbar() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const authNavLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Scanner', path: '/scanner', icon: ScanLine },
    { name: 'Compliance', path: '/compliance-analysis', icon: ShieldCheck },
    { name: 'Health Analysis', path: '/health-analysis', icon: ActivitySquare },
    { name: 'History (12M)', path: '/history', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#123C2A] text-[#F5F3EA] shadow-md border-b border-[#0B291D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Logo & Name */}
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-3 group focus-visible:outline-white">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FAF9F5] p-1.5 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <img src="/logo.svg" alt="LabelSure Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-[#F5F3EA]">
                  LabelSure
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-[#DCE8D8] text-[#123C2A] rounded-sm">
                  Food
                </span>
              </div>
              <p className="text-[10px] text-[#DCE8D8]/75 hidden sm:block -mt-0.5">
                Packaging Compliance & Health Intelligence
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated ? (
            <nav className="hidden lg:flex items-center gap-1.5">
              {authNavLinks.map((link) => {
                const active = isActive(link.path);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'bg-[#0B291D] text-[#FAF9F5] shadow-xs'
                        : 'text-[#F5F3EA]/80 hover:text-[#FAF9F5] hover:bg-[#0B291D]/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 opacity-80" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#F5F3EA]/80">
              <a href="#how-it-works" className="hover:text-[#FAF9F5] transition-colors">How It Works</a>
              <a href="#compliance-framework" className="hover:text-[#FAF9F5] transition-colors">Regulatory Scope</a>
              <a href="#health-grading" className="hover:text-[#FAF9F5] transition-colors">Nutritional Health</a>
            </nav>
          )}

          {/* Right Action Area */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/scanner" className="hidden sm:inline-flex">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={ScanLine}
                    className="font-bold shadow-xs hover:bg-[#FAF9F5]"
                  >
                    Start New Scan
                  </Button>
                </Link>
                <UserMenu />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button size="sm" variant="ghost" className="text-[#F5F3EA] hover:bg-[#0B291D]">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" variant="secondary" className="font-bold">
                    Create Account
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle (only on mobile) */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-[#F5F3EA] hover:bg-[#0B291D] focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#0B291D] bg-[#123C2A] px-4 pt-3 pb-5 space-y-1.5 animate-in slide-in-from-top-2 duration-150">
          {authNavLinks.map((link) => {
            const active = isActive(link.path);
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-[#0B291D] text-[#FAF9F5]'
                    : 'text-[#F5F3EA]/80 hover:bg-[#0B291D]/50 hover:text-[#FAF9F5]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
          <div className="pt-2">
            <Link to="/scanner" onClick={() => setMobileMenuOpen(false)}>
              <Button fullWidth variant="secondary" icon={ScanLine} className="font-bold">
                Start New Scan
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
