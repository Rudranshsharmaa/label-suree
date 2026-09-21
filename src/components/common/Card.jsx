import React from 'react';

export function Card({
  children,
  className = '',
  padding = 'default',
  variant = 'surface',
  hover = false,
  onClick,
  ...props
}) {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    default: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const variantStyles = {
    surface: 'bg-[#FAF9F5] border border-[#123C2A]/10 text-[#17231C]',
    cream: 'bg-[#E9E8DC] border border-[#123C2A]/15 text-[#17231C]',
    white: 'bg-white border border-[#123C2A]/10 text-[#17231C]',
    dark: 'bg-[#123C2A] text-[#F5F3EA] border border-[#0B291D]',
  };

  const hoverStyle = hover
    ? 'transition-all duration-200 hover:shadow-card hover:-translate-y-0.5 cursor-pointer'
    : 'shadow-soft';

  return (
    <div
      className={`rounded-2xl ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyle} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
