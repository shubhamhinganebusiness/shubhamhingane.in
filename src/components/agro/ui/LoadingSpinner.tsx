import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  label = 'Loading...' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      {label && <p className="text-gray-500 font-medium text-sm">{label}</p>}
    </div>
  );
};
