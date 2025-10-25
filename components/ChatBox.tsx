
import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';
import { UserIcon, BotIcon, SendIcon, LoadingIcon } from './icons/Icons';

interface ChatBoxProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="w-full max-w-2xl h-[80vh] flex flex-col bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && <BotIcon />}
            <div className={`px-5 py-3 rounded-2xl max-w-md ${msg.role === 'user' ? 'bg-indigo-500/80 rounded-br-none' : 'bg-gray-700/60 rounded-bl-none'}`}>
              <p className="text-white/90 whitespace-pre-wrap">{msg.text}</p>
            </div>
            {msg.role === 'user' && <UserIcon />}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-4">
            <BotIcon />
            <div className="px-5 py-3 rounded-2xl bg-gray-700/60 rounded-bl-none">
              <LoadingIcon />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-black/20">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask me anything..."
            className="w-full bg-gray-800/50 border border-white/10 rounded-lg py-3 pr-14 pl-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none transition-all duration-300"
            rows={1}
            style={{ minHeight: '52px', maxHeight: '200px' }}
            onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
            }}
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 transition-colors duration-300" disabled={isLoading || !inputText.trim()}>
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  );
};
