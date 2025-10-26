import type { Message } from '../types.ts';

const WORKER_URL = 'https://ginginv2.realganganadul.workers.dev';

export const api = {
  login: async (username, password): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${WORKER_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      if (response.ok) return { success: true };
      const errorData = await response.json().catch(() => ({ error: 'Login failed due to a network or server issue.' }));
      return { success: false, error: errorData.error || 'Invalid credentials or unknown error.' };
    } catch (error) {
      console.error("Login API call failed:", error);
      return { success: false, error: 'Could not connect to the server.' };
    }
  },

  logout: async () => {
    try {
      await fetch(`${WORKER_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
        console.error("Logout API call failed:", error);
    }
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

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.text || `API error: ${response.statusText}`);
      }
      return data.text;
    } catch (error) {
      console.error("Failed to get chat response:", error);
      throw new Error((error as Error).message || "I'm sorry, but I encountered an error while processing your request. Please try again.");
    }
  },
};
