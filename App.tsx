import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChatMessage } from './types';
import { sendMessageToAI, updateSystemInstruction } from './services/geminiService';
import { reportInquiry } from './services/telegramService';
import { getSessionId } from './services/sessionService';
import { getChatHistory, saveChatHistory } from './services/historyService';
import ChatInput from './components/ItineraryForm';
import ChatHistory from './components/ItineraryDisplay';
import ErrorDisplay from './components/ErrorDisplay';
import LoginModal from './components/LoginModal';
import AdminPanel from './components/AdminPanel';
import { CoffeeIcon, LogInIcon, LogOutIcon, SheetIcon } from './components/icons';

const App: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
    const sessionIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            setIsLoggedIn(true);
        }
        if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
            console.warn("Admin credentials (ADMIN_USERNAME, ADMIN_PASSWORD) are not set. Login will not work.");
        }
        sessionIdRef.current = getSessionId();
    }, []);

    const initializeChat = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        if (!sessionIdRef.current) {
            sessionIdRef.current = getSessionId();
        }

        try {
            let history = await getChatHistory(sessionIdRef.current);
            if (history.length === 0) {
                // Brand new session, get welcome message
                const result = await sendMessageToAI([], "Hello");
                const welcomeMessage: ChatMessage = { role: 'model', content: result };
                history = [welcomeMessage];
                // Save the initial greeting to the history
                await saveChatHistory(sessionIdRef.current, history);
            }
            setMessages(history);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred while starting the chat.');
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        initializeChat();
    }, [initializeChat]);


    const handleSendMessage = useCallback(async (message: string) => {
        if (!message || !sessionIdRef.current) return;

        const userMessage: ChatMessage = { role: 'user', content: message };
        const currentMessages = [...messages, userMessage];
        setMessages(currentMessages);
        setIsLoading(true);
        setError(null);

        try {
            // Pass the up-to-date history to the AI service
            const result = await sendMessageToAI(currentMessages, message);
            const modelMessage: ChatMessage = { role: 'model', content: result };
            
            // Use functional update to get the latest state
            setMessages(prev => {
                const updatedHistory = [...prev, modelMessage];
                // Save the full conversation history
                saveChatHistory(sessionIdRef.current!, updatedHistory).catch(console.error);
                return updatedHistory;
            });

            // Silently report the inquiry to Telegram
            reportInquiry(userMessage.content, modelMessage.content).catch(reportError => {
                console.error("Failed to report inquiry to Telegram:", reportError);
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [messages]);
    
    const handleLogin = (username?: string, password?: string): boolean => {
        const adminUser = process.env.ADMIN_USERNAME;
        const adminPass = process.env.ADMIN_PASSWORD;

        if (!adminUser || !adminPass) {
             console.error("Admin credentials are not configured.");
             return false;
        }

        if (username === adminUser && password === adminPass) {
            setIsLoggedIn(true);
            localStorage.setItem('isLoggedIn', 'true');
            setIsLoginModalOpen(false);
            return true;
        }
        return false;
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem('isLoggedIn');
    };


    return (
        <div className="h-screen w-screen flex flex-col font-sans text-white">
            <header className="flex-shrink-0 z-10 bg-black/30 backdrop-blur-lg border-b border-white/20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                         <CoffeeIcon className="h-8 w-8 text-brand-light" />
                        <h1 className="text-xl sm:text-2xl font-bold text-white">
                            Mantik Coffee Assistant
                        </h1>
                    </div>
                     <div className="flex items-center space-x-2">
                        {isLoggedIn ? (
                            <>
                                <button
                                    onClick={() => setIsAdminPanelOpen(true)}
                                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-200 hover:bg-white/20 rounded-md transition-colors"
                                >
                                    <SheetIcon className="h-4 w-4 mr-2" />
                                    Admin Panel
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-200 hover:bg-white/20 rounded-md transition-colors"
                                >
                                    <LogOutIcon className="h-4 w-4 mr-2" />
                                    Log Out
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsLoginModalOpen(true)}
                                className="flex items-center px-3 py-2 text-sm font-medium text-gray-200 hover:bg-white/20 rounded-md transition-colors"
                            >
                                <LogInIcon className="h-4 w-4 mr-2" />
                                Admin Log In
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col container mx-auto w-full max-w-3xl min-h-0 py-4">
                 <div className="flex-1 flex flex-col bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                    {error ? (
                        <div className="flex-1 flex items-center justify-center p-4">
                            <ErrorDisplay message={error} onRetry={initializeChat} />
                        </div>
                    ) : (
                        <ChatHistory messages={messages} isLoading={isLoading} />
                    )}
                    <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
                 </div>
            </main>
            <LoginModal 
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onLogin={handleLogin}
            />
            <AdminPanel
                isOpen={isAdminPanelOpen}
                onClose={() => setIsAdminPanelOpen(false)}
                onUpdateSuccess={() => {
                    setIsAdminPanelOpen(false);
                    // No need to re-initialize chat. The new system prompt will be used on the next message.
                }}
            />
        </div>
    );
};

export default App;
