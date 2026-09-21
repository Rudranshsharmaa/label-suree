import React, { forwardRef } from 'react';

export const FormInput = forwardRef(function FormInput({
  label,
  id,
  type = 'text',
  error,
  helperText,
  icon: Icon,
  required = false,
  className = '',
  ...props
}, ref) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs sm:text-sm font-semibold text-[#17231C]">
          {label} {required && <span className="text-[#B94A48]">*</span>}
        </label>
      )}

      <div className="relative rounded-xl shadow-xs">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#68736B]">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-desc` : undefined}
          className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[#17231C] placeholder:text-[#68736B]/60 focus:ring-2 focus:ring-[#123C2A] focus:outline-none transition-all ${
            Icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-[#B94A48] focus:border-[#B94A48] focus:ring-[#B94A48]/20'
              : 'border-[#123C2A]/20 focus:border-[#123C2A]'
          } ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-xs font-medium text-[#B94A48]">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-desc`} className="text-xs text-[#68736B]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});
