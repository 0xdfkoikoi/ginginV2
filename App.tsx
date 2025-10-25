import React, { useState, useEffect, useCallback } from 'react';
import { ChatBox } from './components/ChatBox.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import type { Message } from './types.ts';
import { api } from './services/api.ts';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "Hello! I am your AI Business Assistant. How can I help you today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const verifySession = async () => {
      const { isLoggedIn } = await api.checkSession();
      setIsLoggedIn(isLoggedIn);
    };
    verifySession();
  }, []);
  
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const history = messages.slice(1); // Exclude initial welcome message
      const responseText = await api.getChatResponse(history, userMessage);
      const modelMessage: Message = { role: 'model', text: responseText };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Failed to get response from worker:", error);
      const errorMessage: Message = {
        role: 'model',
        text: "Sorry, I'm having trouble connecting to my brain right now. Please try again later.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = useCallback(async (username, password) => {
    const success = await api.login(username, password);
    if (success) {
      setIsLoggedIn(true);
      setShowLoginModal(false);
      const loginSuccessMessage: Message = {
        role: 'model',
        text: "Admin login successful. You can now ask me to perform office tasks or generate reports.",
      };
      setMessages(prev => [...prev, loginSuccessMessage]);
    } else {
      alert('Invalid credentials!');
    }
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setIsLoggedIn(false);
    const logoutMessage: Message = {
      role: 'model',
      text: "You have been logged out.",
    };
    setMessages(prev => [...prev, logoutMessage]);
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-gray-900 via-slate-800 to-indigo-900 text-white font-sans overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-cover bg-center" style={{backgroundImage: "url('https://picsum.photos/1920/1080?grayscale&blur=2')"}}></div>
      <div className="absolute top-0 left-0 w-full h-full bg-black/50"></div>
      
      <header className="absolute top-0 left-0 w-full p-4 sm:p-6 flex justify-between items-center z-20">
        <h1 className="text-xl sm:text-2xl font-bold text-white/90 tracking-wider">AI Business Assistant</h1>
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500/50 text-white font-semibold rounded-lg border border-red-400/60 backdrop-blur-sm hover:bg-red-500/70 transition-colors duration-300"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-4 py-2 bg-white/10 text-white font-semibold rounded-lg border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors duration-300"
          >
            Admin Login
          </button>
        )}
      </header>

      <main className="relative flex items-center justify-center min-h-screen p-4">
        <ChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </main>

      {showLoginModal && (
        <LoginModal onLogin={handleLogin} onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
};

export default App;
