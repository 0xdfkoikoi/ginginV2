import type { Message } from '../types';

const WORKER_URL = 'https://ginginv2.realganganadul.workers.dev';

export const api = {
  login: async (username, password) => {
    const response = await fetch(`${WORKER_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });
    return response.ok;
  },

  logout: async () => {
    await fetch(`${WORKER_URL}/api/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  },

  checkSession: async (): Promise<{ isLoggedIn: boolean }> => {
    try {
      const response = await fetch(`${WORKER_URL}/api/session`, {
        credentials: 'include',
      });
      if (!response.ok) return { isLoggedIn: false };
      return response.json();
    } catch (error) {
      console.error("Failed to check session:", error);
      return { isLoggedIn: false };
    }
  },

  getChatResponse: async (history: Message[], newUserMessage: Message): Promise<string> => {
    try {
      const response = await fetch(`${WORKER_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, newUserMessage }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("Failed to get chat response:", error);
      return "I'm sorry, but I encountered an error while processing your request. Please try again.";
    }
  },
};
