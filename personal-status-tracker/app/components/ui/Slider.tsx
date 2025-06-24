import React from 'react';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  showLabels?: boolean;
  minLabel?: string;
  maxLabel?: string;
}

export function Slider({ 
  label,
  showLabels = true,
  minLabel,
  maxLabel,
  className = '',
  id,
  ...props 
}: SliderProps) {
  const sliderId = id || `slider-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div role="group" aria-labelledby={label ? `${sliderId}-label` : undefined}>
      {label && (
        <label id={`${sliderId}-label`} className="sr-only">
          {label}
        </label>
      )}
      <div className="space-y-2">
        <input
          id={sliderId}
          type="range"
          className={`
            w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer 
            dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500
            ${className}
          `}
          {...props}
        />
        {showLabels && minLabel && maxLabel && (
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}