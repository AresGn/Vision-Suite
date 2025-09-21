
import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-4',
        lg: 'w-12 h-12 border-4',
    };
    return (
        <div 
            className={`animate-spin rounded-full border-sky-400 border-t-transparent ${sizeClasses[size]}`}
            role="status"
            aria-live="polite"
        >
             <span className="sr-only">Loading...</span>
        </div>
    );
};

export default Spinner;