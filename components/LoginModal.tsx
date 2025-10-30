import React, { useState, useEffect } from 'react';
import { AlertTriangleIcon, XIcon } from './icons';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (username?: string, password?: string) => boolean;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setUsername('');
            setPassword('');
            setError(null);
            const timer = setTimeout(() => {
                setShowContent(true);
            }, 10);
            return () => clearTimeout(timer);
        } else {
            setShowContent(false);
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }

        const success = onLogin(username, password);
        if (!success) {
            setError('Invalid username or password. Please try again.');
        }
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };
    
    return (
        <div 
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleOverlayClick}
            aria-modal="true"
            role="dialog"
        >
            <div className={`relative bg-gray-900/50 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl w-full max-w-sm m-4 overflow-hidden transform transition-all duration-300 ${showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                <div className="p-8 text-white">
                    <h2 className="text-2xl font-bold text-center mb-2">Admin Login</h2>
                    <p className="text-center text-gray-300 mb-6">Enter your credentials to continue.</p>
                    
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="username" className="text-sm font-medium text-gray-300">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-light"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="password-input" className="text-sm font-medium text-gray-300">Password</label>
                                <input
                                    id="password-input"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-light"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="mt-4 flex items-start text-sm text-red-300 bg-red-500/20 p-3 rounded-md border border-red-400/50">
                                 <AlertTriangleIcon className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="mt-6">
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-brand-dark bg-brand-light hover:bg-brand-light/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light transition-colors"
                            >
                                Log In
                            </button>
                        </div>
                    </form>
                </div>
                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-white" aria-label="Close modal">
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
        </div>
    );
};

export default LoginModal;