import React from 'react';

export function ResponsiveContainer({
  children,
  className = '',
  maxWidth = 'max-w-7xl',
  noPadding = false,
}) {
  const paddingClass = noPadding ? '' : 'px-4 sm:px-6 lg:px-8';
  return (
    <div className={`mx-auto w-full ${maxWidth} ${paddingClass} ${className}`}>
      {children}
    </div>
  );
}
