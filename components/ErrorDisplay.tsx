import React from 'react';
import { AlertTriangleIcon, RefreshCwIcon } from './icons';

interface ErrorDisplayProps {
    message: string;
    onRetry: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
    return (
        <div className="text-center p-8 border-2 border-dashed border-red-400/50 bg-red-500/20 backdrop-blur-md rounded-lg text-white">
            <div className="flex justify-center mb-4">
                <AlertTriangleIcon className="h-12 w-12 text-red-300" />
            </div>
            <h3 className="text-xl font-semibold text-white">Oops! Something went wrong.</h3>
            <p className="mt-2 text-red-200">{message}</p>
            <button
                onClick={onRetry}
                className="mt-6 inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Try Again
            </button>
        </div>
    );
};

export default ErrorDisplay;
