import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export const PasswordInput = forwardRef(function PasswordInput({
  label = 'Password',
  id = 'password',
  error,
  helperText,
  required = false,
  className = '',
  ...props
}, ref) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full space-y-1.5 text-left">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs sm:text-sm font-semibold text-[#17231C]">
          {label} {required && <span className="text-[#B94A48]">*</span>}
        </label>
      </div>

      <div className="relative rounded-xl shadow-xs">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#68736B]">
          <Lock className="h-4 w-4" aria-hidden="true" />
        </div>

        <input
          ref={ref}
          id={id}
          type={showPassword ? 'text' : 'password'}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-desc` : undefined}
          className={`block w-full rounded-xl border bg-white pl-10 pr-10 py-2.5 text-sm text-[#17231C] placeholder:text-[#68736B]/60 focus:ring-2 focus:ring-[#123C2A] focus:outline-none transition-all ${
            error
              ? 'border-[#B94A48] focus:border-[#B94A48] focus:ring-[#B94A48]/20'
              : 'border-[#123C2A]/20 focus:border-[#123C2A]'
          } ${className}`}
          {...props}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#68736B] hover:text-[#17231C] focus:outline-none"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-[#B94A48]">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id}-desc`} className="text-xs text-[#68736B]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});
