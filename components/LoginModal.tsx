import React, { useState } from 'react';

interface LoginModalProps {
  onLogin: (username, password) => Promise<void>;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    await onLogin(username, password);
    setIsLoggingIn(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="w-full max-w-sm bg-gray-800/50 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-center text-white mb-6">Admin Login</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
              required
              disabled={isLoggingIn}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
              required
              disabled={isLoggingIn}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-500 transition-colors duration-300 disabled:bg-indigo-800 disabled:cursor-not-allowed"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Logging In...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
};
