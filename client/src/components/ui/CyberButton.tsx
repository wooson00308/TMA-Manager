import React, { ButtonHTMLAttributes, forwardRef } from 'react';

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'default';
  children: React.ReactNode;
}

export const CyberButton = forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ variant = 'primary', children, className = '', ...props }, ref) => {
    const baseClasses = 'cyber-button p-4 text-left transition-colors group';
    const variantClasses = {
      primary: 'cyber-border hover:bg-blue-900',
      secondary: 'border border-gray-600 hover:bg-gray-800',
      danger: 'border border-red-600 hover:bg-red-900',
      default: 'cyber-border hover:bg-blue-900',
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

CyberButton.displayName = 'CyberButton';
