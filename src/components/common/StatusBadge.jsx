import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  EyeOff, 
  Slash,
  Sparkles,
  Utensils
} from 'lucide-react';

export function StatusBadge({ status, size = 'md', className = '' }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  let config = {
    label: status,
    bg: 'bg-[#E9E8DC]',
    text: 'text-[#17231C]',
    border: 'border-[#123C2A]/15',
    icon: HelpCircle,
  };

  // 1. Compliance Statuses
  if (normalized === 'COMPLIANT') {
    config = {
      label: 'Compliant',
      bg: 'bg-[#DCE8D8]',
      text: 'text-[#123C2A]',
      border: 'border-[#2E6847]/30',
      icon: CheckCircle2,
    };
  } else if (normalized === 'NON-COMPLIANT' || normalized === 'NON_COMPLIANT' || normalized === 'CONFIRMED MISSING' || normalized === 'CONFIRMED_MISSING') {
    config = {
      label: normalized.includes('MISSING') ? 'Confirmed Missing' : 'Non-Compliant',
      bg: 'bg-[#FBEBEB]',
      text: 'text-[#B94A48]',
      border: 'border-[#B94A48]/30',
      icon: XCircle,
    };
  } else if (normalized === 'REQUIRES REVIEW' || normalized === 'REQUIRES_REVIEW') {
    config = {
      label: 'Requires Review',
      bg: 'bg-[#FEF6E8]',
      text: 'text-[#C78A28]',
      border: 'border-[#C78A28]/30',
      icon: AlertTriangle,
    };
  } else if (normalized === 'UNREADABLE') {
    config = {
      label: 'Unreadable Image',
      bg: 'bg-[#F2F0E6]',
      text: 'text-[#68736B]',
      border: 'border-[#68736B]/30',
      icon: EyeOff,
    };
  } else if (normalized === 'NOT PROVIDED' || normalized === 'NOT_PROVIDED') {
    config = {
      label: 'View Not Provided',
      bg: 'bg-[#E9E8DC]',
      text: 'text-[#68736B]',
      border: 'border-[#68736B]/20',
      icon: EyeOff,
    };
  } else if (normalized === 'NOT APPLICABLE' || normalized === 'NOT_APPLICABLE') {
    config = {
      label: 'Not Applicable',
      bg: 'bg-[#E9E8DC]',
      text: 'text-[#68736B]',
      border: 'border-[#68736B]/20',
      icon: Slash,
    };
  }

  // 2. Food Classification Statuses
  else if (normalized.includes('FOOD PRODUCT DETECTED')) {
    config = {
      label: 'Food Product',
      bg: 'bg-[#DCE8D8]',
      text: 'text-[#123C2A]',
      border: 'border-[#2E6847]/30',
      icon: Utensils,
    };
  } else if (normalized.includes('NON-FOOD')) {
    config = {
      label: 'Non-Food Item',
      bg: 'bg-[#FBEBEB]',
      text: 'text-[#B94A48]',
      border: 'border-[#B94A48]/30',
      icon: XCircle,
    };
  } else if (normalized.includes('UNCERTAIN')) {
    config = {
      label: 'Uncertain Category',
      bg: 'bg-[#FEF6E8]',
      text: 'text-[#C78A28]',
      border: 'border-[#C78A28]/30',
      icon: AlertTriangle,
    };
  }

  // 3. Health Grades
  else if (['A+', 'A', 'B', 'C', 'D', 'E', 'F'].includes(normalized)) {
    const gradeColors = {
      'A+': { bg: 'bg-[#123C2A]', text: 'text-[#F5F3EA]', border: 'border-[#0B291D]' },
      'A': { bg: 'bg-[#2E6847]', text: 'text-white', border: 'border-[#123C2A]' },
      'B': { bg: 'bg-[#347A4D]', text: 'text-white', border: 'border-[#2A633E]' },
      'C': { bg: 'bg-[#C78A28]', text: 'text-white', border: 'border-[#A36F1C]' },
      'D': { bg: 'bg-[#D97724]', text: 'text-white', border: 'border-[#BA6016]' },
      'E': { bg: 'bg-[#C2523C]', text: 'text-white', border: 'border-[#A43D2A]' },
      'F': { bg: 'bg-[#B94A48]', text: 'text-white', border: 'border-[#8F3533]' },
    };
    const c = gradeColors[normalized] || gradeColors['C'];
    config = {
      label: `Grade ${normalized}`,
      bg: c.bg,
      text: c.text,
      border: c.border,
      icon: Sparkles,
    };
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs sm:text-sm px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  };

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-lg border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} ${className}`}
    >
      <IconComponent className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}
