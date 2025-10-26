import { Message } from '../types';

const API_BASE_URL = 'https://ginginv2.realganganadul.workers.dev';

export interface LoginResponse {
  success: boolean;
  token?: string;
  error?: string;
}

/**
 * Sends login credentials to the backend worker.
 */
export const login = async (username?: string, password?: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data: LoginResponse = await response.json();

    if (!response.ok) {
        return { success: false, error: data.error || 'Login failed.' };
    }

    return data;
  } catch (error) {
    console.error("Login API error:", error);
    return { success: false, error: 'Could not connect to the server.' };
  }
};

/**
 * Sends the chat history to the backend worker to get an AI response.
 */
export const sendMessage = async (history: Message[], token: string | null): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include the auth token if the user is logged in
        'Authorization': `Bearer ${token || ''}`,
      },
      body: JSON.stringify({ history }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Network response was not ok');
    }

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error("Error sending message:", error);
    return "Sorry, I'm having trouble connecting to my brain right now. Please try again later.";
  }
};
