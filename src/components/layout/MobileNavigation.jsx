import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ScanLine, 
  History, 
  ShieldCheck, 
  ActivitySquare,
  Home
} from 'lucide-react';

export function MobileNavigation() {
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Compliance', path: '/compliance-analysis', icon: ShieldCheck },
    { label: 'Scan', path: '/scanner', icon: ScanLine, isPrimary: true },
    { label: 'Health', path: '/health-analysis', icon: ActivitySquare },
    { label: 'History', path: '/history', icon: History },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#FAF9F5] border-t border-[#123C2A]/15 shadow-medium pb-safe-area"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center -mt-5 group focus-visible:outline-[#123C2A]"
                aria-label="Scanner"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#123C2A] text-[#F5F3EA] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border-2 border-[#FAF9F5]">
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <span className="text-[10px] font-bold text-[#123C2A] mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-colors ${
                isActive
                  ? 'text-[#123C2A] font-bold'
                  : 'text-[#47544C] hover:text-[#17231C]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} aria-hidden="true" />
              <span className="text-[10px] mt-0.5 leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
