import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.98]';
  
  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px] gap-1.5',
    md: 'text-sm px-4 py-2.5 min-h-[44px] gap-2',
    lg: 'text-base px-6 py-3 min-h-[48px] gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-[#123C2A] hover:bg-[#0B291D] text-[#F5F3EA] shadow-sm hover:shadow focus-visible:outline-[#123C2A]',
    secondary: 'bg-[#E9E8DC] hover:bg-[#DCE8D8] text-[#123C2A] border border-[#123C2A]/10 focus-visible:outline-[#123C2A]',
    outline: 'bg-transparent border-2 border-[#123C2A] text-[#123C2A] hover:bg-[#123C2A]/5 focus-visible:outline-[#123C2A]',
    ghost: 'bg-transparent text-[#17231C] hover:bg-[#123C2A]/5 focus-visible:outline-[#123C2A]',
    danger: 'bg-[#B94A48] hover:bg-[#9E3E3C] text-white shadow-sm focus-visible:outline-[#B94A48]',
    success: 'bg-[#347A4D] hover:bg-[#2A633E] text-white shadow-sm focus-visible:outline-[#347A4D]',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
        </>
      )}
    </button>
  );
}
