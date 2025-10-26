import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { BotIcon } from './icons/BotIcon';
import { UserIcon } from './icons/UserIcon';
import { SendIcon } from './icons/SendIcon';

interface ChatBoxProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.sender === 'user';
    return (
      <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-800/50 flex items-center justify-center">
            <BotIcon className="h-5 w-5 text-white"/>
          </div>
        )}
        <div 
          className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl text-stone-100/90 ${isUser ? 'bg-[#856d5b]/60 rounded-br-none' : 'bg-stone-500/20 rounded-bl-none'}`}
        >
          <p className="text-sm leading-relaxed">{message.text}</p>
        </div>
        {isUser && (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-stone-600/50 flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-white"/>
          </div>
        )}
      </div>
    );
  };
  
  const TypingIndicator: React.FC = () => (
    <div className="flex items-start gap-3 my-4 justify-start">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-800/50 flex items-center justify-center">
            <BotIcon className="h-5 w-5 text-white"/>
        </div>
        <div className="max-w-xs px-4 py-3 rounded-2xl bg-stone-500/20 rounded-bl-none flex items-center space-x-1">
          <span className="h-2 w-2 bg-white/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="h-2 w-2 bg-white/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="h-2 w-2 bg-white/50 rounded-full animate-bounce"></span>
        </div>
    </div>
  );

  return (
    <div className="w-full max-w-2xl h-[80vh] flex flex-col bg-[#4a3f35]/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex-1 p-6 overflow-y-auto">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-white/10">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask Mantik AI about our coffee..."
            className="flex-1 bg-white/10 placeholder-white/40 text-white px-4 py-2 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-[#856d5b] focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="w-10 h-10 flex items-center justify-center bg-[#856d5b] rounded-lg text-white disabled:bg-[#856d5b]/50 disabled:cursor-not-allowed hover:bg-[#7a6352] transition-colors"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
