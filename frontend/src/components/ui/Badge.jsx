import React from 'react';

export const Badge = ({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const variantClasses = {
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    danger: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    primary: 'bg-primary-100 text-primary-800 border border-primary-200',
    neutral: 'bg-gray-100 text-gray-700 border border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${
        sizeClasses[size] || sizeClasses.md
      } ${variantClasses[variant] || variantClasses.neutral} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
