import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'light';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  type,
  ...props
}) => {
  const baseStyles =
    'premium-interactive premium-focus inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[0.01em] cursor-pointer active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none will-change-transform';

  const variants = {
    primary:
      'border border-transparent bg-gray-950 text-white shadow-[0_10px_28px_-18px_rgba(17,24,39,0.7)] hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-[0_18px_36px_-22px_rgba(17,24,39,0.8)] focus-visible:ring-gray-900',
    secondary:
      'border border-gray-200 bg-gray-100 text-gray-800 shadow-sm hover:-translate-y-px hover:bg-gray-200 hover:text-gray-900 focus-visible:ring-gray-400',
    danger:
      'border border-transparent bg-red-600 text-white shadow-[0_10px_28px_-18px_rgba(220,38,38,0.5)] hover:-translate-y-px hover:bg-red-700 hover:shadow-[0_18px_34px_-20px_rgba(220,38,38,0.55)] focus-visible:ring-red-500',
    outline:
      'border border-gray-300 bg-white text-gray-700 shadow-sm hover:-translate-y-0.5 hover:border-gray-400 hover:bg-white hover:shadow-[0_14px_28px_-20px_rgba(17,24,39,0.45)] focus-visible:ring-gray-900',
    ghost:
      'border border-transparent bg-transparent text-gray-600 hover:-translate-y-px hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500',
    light:
      'border border-white/80 bg-white text-gray-950 shadow-[0_16px_36px_-26px_rgba(255,255,255,0.95)] hover:-translate-y-0.5 hover:bg-gray-100 hover:shadow-[0_22px_40px_-24px_rgba(255,255,255,0.95)] active:translate-y-0 focus-visible:ring-white/90'
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3 text-sm'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type ?? 'button'}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

