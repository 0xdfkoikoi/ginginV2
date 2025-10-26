import React, { useState, useCallback } from 'react';
import { ChatBox } from './components/ChatBox';
import { LoginModal } from './components/LoginModal';
import { AdminIcon } from './components/icons/AdminIcon';
import { Message } from './types';
import { login, sendMessage } from './services/api';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Welcome to Mantik! I am your AI assistant for our coffee export business. How can I assist you today?", sender: 'ai' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const handleSendMessage = useCallback(async (newMessageText: string) => {
    if (!newMessageText.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: newMessageText,
      sender: 'user',
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const aiResponseText = await sendMessage(updatedMessages, authToken);
      const aiMessage: Message = {
        id: Date.now() + 1,
        text: aiResponseText,
        sender: 'ai',
      };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "Sorry, something went wrong. Please try again.",
        sender: 'ai',
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, authToken]);

  const handleLogin = useCallback(async (username?: string, password?: string) => {
    const response = await login(username, password);
    if (response.success && response.token) {
      setIsLoggedIn(true);
      setAuthToken(response.token);
      setLoginModalOpen(false);
      
      const loginSuccessMessage: Message = {
        id: Date.now(),
        text: "Admin login successful. You now have access to privileged commands.",
        sender: 'ai',
      };
      setMessages(prev => [...prev, loginSuccessMessage]);
      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthToken(null);
     const logoutMessage: Message = {
        id: Date.now(),
        text: "You have been logged out.",
        sender: 'ai',
      };
    setMessages(prev => [...prev, logoutMessage]);
  }


  return (
    <div className="relative h-screen w-screen bg-stone-900 overflow-hidden">
      {/* Background with gradient overlay */}
      <img src="https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=1974&auto=format&fit=crop" alt="Coffee beans background" className="absolute inset-0 w-full h-full object-cover opacity-60"/>
      <div className="absolute inset-0 bg-gradient-to-br from-stone-900/80 via-amber-900/40 to-stone-900/80"></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-4">
        <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center w-full">
            <h1 className="text-2xl font-bold text-stone-200/90 tracking-wider">Mantik AI</h1>
            {isLoggedIn ? (
                 <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600/60 hover:bg-red-600/80 backdrop-blur-sm border border-red-500/30 rounded-lg transition-all"
                >
                    <AdminIcon className="h-5 w-5" />
                    <span>Logout</span>
                </button>
            ) : (
                <button 
                    onClick={() => setLoginModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-200 bg-stone-100/10 hover:bg-stone-100/20 backdrop-blur-sm border border-white/20 rounded-lg transition-all"
                >
                    <AdminIcon className="h-5 w-5" />
                    <span>Admin Login</span>
                </button>
            )}
        </header>

        <ChatBox 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading} 
        />
      </div>

      {isLoginModalOpen && (
        <LoginModal 
          onClose={() => setLoginModalOpen(false)}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
};

export default App;
