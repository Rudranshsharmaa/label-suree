import React from 'react';

export function LoadingSkeleton({ className = '', lines = 3 }) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-[#E9E8DC] rounded-lg"
          style={{ width: i === lines - 1 ? '70%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function EmptyState({
  title = 'No records found',
  description = 'No scans or compliance records match your current filters.',
  icon: Icon,
  actionText,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-[#123C2A]/15 bg-[#FAF9F5]/60 ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-[#E9E8DC] text-[#123C2A] flex items-center justify-center mb-4">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h4 className="text-lg font-bold text-[#17231C]">{title}</h4>
      <p className="mt-1.5 text-sm text-[#68736B] max-w-sm">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 px-4 py-2 text-sm font-semibold rounded-xl bg-[#123C2A] text-[#F5F3EA] hover:bg-[#0B291D] transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading this data.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`p-6 rounded-2xl bg-[#FBEBEB] border border-[#B94A48]/30 text-[#B94A48] ${className}`}>
      <h4 className="text-base font-bold">{title}</h4>
      <p className="mt-1 text-sm text-[#B94A48]/90">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#B94A48] text-white hover:bg-[#9E3E3C] transition-colors"
        >
          Retry Request
        </button>
      )}
    </div>
  );
}
