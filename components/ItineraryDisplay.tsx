import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { UserIcon, BotIcon } from './icons';

interface ChatHistoryProps {
    messages: ChatMessage[];
    isLoading: boolean;
}

const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center border border-white/30 ${isUser ? 'bg-brand-secondary/80' : 'bg-brand-primary/80'}`}>
                {isUser ? <UserIcon className="h-5 w-5" /> : <BotIcon className="h-5 w-5" />}
            </div>
            <div
                className={`px-4 py-3 rounded-xl max-w-lg border border-white/20 shadow-md ${isUser ? 'bg-brand-secondary/40 rounded-br-none' : 'bg-black/30 backdrop-blur-md rounded-bl-none'}`}
            >
                <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{message.content}</p>
            </div>
        </div>
    );
};


const TypingIndicator: React.FC = () => (
    <div className="flex items-start gap-3">
        <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-brand-primary/80 border border-white/30">
            <BotIcon className="h-5 w-5" />
        </div>
        <div className="px-4 py-3 rounded-xl bg-black/30 backdrop-blur-md rounded-bl-none border border-white/20">
            <div className="flex items-center justify-center space-x-1.5">
                <span className="h-2 w-2 bg-gray-300 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-gray-300 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-gray-300 rounded-full animate-pulse"></span>
            </div>
        </div>
    </div>
);


const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, isLoading }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    return (
        <div ref={scrollRef} className="flex-1 p-6 space-y-6 overflow-y-auto">
            {messages.map((msg, index) => (
                <Message key={index} message={msg} />
            ))}
            {isLoading && messages.length > 0 && <TypingIndicator />}
        </div>
    );
};

export default ChatHistory;