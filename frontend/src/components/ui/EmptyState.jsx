import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'There are no records to display at this time.',
  actionLabel,
  onAction,
  actionIcon,
  actionTo,
  children,
  className = '',
}) => {
  return (
    <div
      className={`card flex flex-col items-center justify-center text-center p-12 border-dashed border-2 border-gray-200 bg-white/60 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4 ring-8 ring-primary-50/50">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      {actionLabel && (
        <Button
          variant="primary"
          onClick={onAction}
          icon={actionIcon}
          {...(actionTo ? { as: 'a', href: actionTo } : {})}
        >
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
};

export default EmptyState;
