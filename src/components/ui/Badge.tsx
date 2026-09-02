import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'purple' | 'danger' | 'slate' | 'demo';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  const variantMap: Record<string, string> = {
    primary: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    info: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    danger: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    slate: 'bg-slate-800/80 text-slate-300 border border-slate-700/60',
    demo: 'bg-amber-500/10 text-amber-400 border border-amber-500/30 tracking-wide uppercase font-semibold text-[10px]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-md whitespace-nowrap ${variantMap[variant]} ${sizeClasses} ${className}`}
    >
      {children}
    </span>
  );
};
