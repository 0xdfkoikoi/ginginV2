import React, { useState } from 'react';
import { SendIcon } from './icons';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedMessage = message.trim();
        if (!trimmedMessage || isLoading) return;
        
        onSendMessage(trimmedMessage);
        setMessage('');
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center p-4 bg-black/20 backdrop-blur-lg border-t border-white/20">
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                    }
                }}
                placeholder="Ask about our coffee, hours, or Wi-Fi..."
                rows={1}
                className="flex-1 w-full px-4 py-2 bg-white/10 text-white placeholder-gray-300 border border-white/20 rounded-lg resize-none focus:ring-2 focus:ring-brand-light/50 focus:outline-none transition-all"
                style={{maxHeight: '100px'}}
            />
            <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="ml-4 flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-brand-light/80 text-brand-dark hover:bg-brand-light disabled:bg-gray-400/50 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label="Send message"
            >
                <SendIcon className="h-5 w-5" />
            </button>
        </form>
    );
};

export default ChatInput;