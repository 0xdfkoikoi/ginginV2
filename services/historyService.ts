import { ChatMessage } from '../types';

const WORKER_URL = 'https://ginginv2.realganganadul.workers.dev/chat_history';

/**
 * Fetches the chat history for a given session ID from the Cloudflare worker.
 * @param sessionId The user's unique session identifier.
 * @returns A promise that resolves to an array of chat messages.
 */
export const getChatHistory = async (sessionId: string): Promise<ChatMessage[]> => {
    try {
        const response = await fetch(`${WORKER_URL}?sessionId=${sessionId}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Worker request for history failed with status ${response.status}: ${errorText}`);
        }
        return await response.json() as ChatMessage[];
    } catch (error) {
        console.error("Error fetching chat history from worker:", error);
        // Return an empty array on failure so the app can start a new chat.
        return []; 
    }
};

/**
 * Saves the chat history for a given session ID to the Cloudflare worker.
 * @param sessionId The user's unique session identifier.
 * @param messages The array of chat messages to save.
 */
export const saveChatHistory = async (sessionId: string, messages: ChatMessage[]): Promise<void> => {
    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId, messages }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Worker request to save history failed with status ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error("Error saving chat history to worker:", error);
    }
};
