/**
 * Retrieves the session ID from sessionStorage. If it doesn't exist,
 * it creates a new one, stores it, and then returns it.
 * @returns {string} The user's session ID.
 */
export const getSessionId = (): string => {
    const SESSION_KEY = 'mantik-coffee-session-id';
    let sessionId = sessionStorage.getItem(SESSION_KEY);

    if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem(SESSION_KEY, sessionId);
    }

    return sessionId;
};
