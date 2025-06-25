import { ButtonHTMLAttributes, forwardRef } from 'react';

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'default';
  children: React.ReactNode;
}

export const CyberButton = forwardRef<HTMLButtonElement, CyberButtonProps>(function CyberButton({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}, ref) {
  const getVariantClasses = (variant: string) => {
    switch (variant) {
      case 'primary':
        return `
          bg-gradient-to-r from-sky-400 to-blue-500 
          hover:from-blue-500 hover:to-indigo-500
          text-white font-semibold
          shadow-lg shadow-sky-400/25
          hover:shadow-xl hover:shadow-sky-500/30
          hover:-translate-y-1
          border-0
        `;
      case 'secondary':
        return `
          bg-gradient-to-r from-slate-100 to-slate-200
          hover:from-slate-200 hover:to-slate-300
          text-slate-700 font-semibold
          border border-slate-300
          shadow-md shadow-slate-200/50
          hover:shadow-lg hover:shadow-slate-300/50
          hover:-translate-y-0.5
        `;
      case 'danger':
        return `
          bg-gradient-to-r from-rose-400 to-rose-500
          hover:from-rose-500 hover:to-rose-600
          text-white font-semibold
          shadow-lg shadow-rose-400/25
          hover:shadow-xl hover:shadow-rose-500/30
          hover:-translate-y-1
          border-0
        `;
      default:
        return `
          bg-gradient-to-r from-indigo-400 to-indigo-500
          hover:from-indigo-500 hover:to-indigo-600
          text-white font-semibold
          shadow-lg shadow-indigo-400/25
          hover:shadow-xl hover:shadow-indigo-500/30
          hover:-translate-y-1
          border-0
        `;
    }
  };

  return (
    <button
      ref={ref as any}
      className={`
        px-6 py-3 rounded-xl
        transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        focus:outline-none focus:ring-4 focus:ring-sky-400/20
        backdrop-blur-sm
        font-orbitron
        ${getVariantClasses(variant)}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
});
