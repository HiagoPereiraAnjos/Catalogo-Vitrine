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
    primary: 'btn-variant-primary border',
    secondary: 'btn-variant-secondary border',
    danger: 'btn-variant-danger border',
    outline: 'btn-variant-outline border',
    ghost: 'btn-variant-ghost border',
    light: 'btn-variant-light border'
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

