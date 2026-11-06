import React, { forwardRef } from 'react';

export const Select = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      required,
      id,
      options = [],
      placeholder = 'Select an option',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="label flex items-center justify-between">
            <span>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Icon className="h-5 h-5" />
            </div>
          )}
          <select
            id={selectId}
            ref={ref}
            required={required}
            className={`input-field bg-white ${Icon ? 'pl-10' : ''} ${
              error ? 'border-red-400 focus:ring-red-400' : ''
            } ${className}`}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {children
              ? children
              : options.map((opt) => {
                  const val = typeof opt === 'object' ? opt.value : opt;
                  const lbl = typeof opt === 'object' ? opt.label : opt;
                  return (
                    <option key={val} value={val}>
                      {lbl}
                    </option>
                  );
                })}
          </select>
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
