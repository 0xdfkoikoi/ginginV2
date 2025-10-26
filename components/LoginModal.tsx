import React, { useState } from 'react';

interface LoginModalProps {
  onClose: () => void;
  onLogin: (username?: string, password?: string) => Promise<{success: boolean; error?: string}>;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        const result = await onLogin(username, password);
        if (!result.success) {
            setError(result.error || 'Login failed.');
        }
        setIsSubmitting(false);
    }

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
    >
      <div 
        className="w-full max-w-sm p-8 bg-[#4a3f35]/50 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white text-center mb-6">Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/70 block mb-2">Username</label>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#856d5b]"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/70 block mb-2">Password</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#856d5b]"
                required
              />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 py-2.5 bg-[#856d5b] text-white font-semibold rounded-lg hover:bg-[#7a6352] disabled:bg-[#856d5b]/50 disabled:cursor-wait transition-colors"
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};
