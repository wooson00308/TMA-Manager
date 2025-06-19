import { ButtonHTMLAttributes } from 'react';

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

export function CyberButton({ variant = 'primary', children, className = '', ...props }: CyberButtonProps) {
  const baseClasses = 'cyber-button p-4 text-left transition-colors group';
  const variantClasses = {
    primary: 'cyber-border hover:bg-blue-900',
    secondary: 'border border-gray-600 hover:bg-gray-800',
    danger: 'border border-red-600 hover:bg-red-900',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
