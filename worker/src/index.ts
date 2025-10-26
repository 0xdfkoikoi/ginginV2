import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { GoogleGenAI, FunctionDeclaration, Type, GenerateContentResponse, Chat, Part } from "@google/genai";
import { GoogleAuth } from 'google-auth-library';
import type { Message } from '../../types';

// Fix: Add KVNamespace interface to solve TypeScript error.
interface KVNamespace {
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  get(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
}

// Define the environment bindings for TypeScript
type Bindings = {
  GEMINI_API_KEY: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  SESSION_KV: KVNamespace;
  GOOGLE_SERVICE_ACCOUNT_JSON: string;
  SPREADSHEET_ID: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// --- CORS Middleware ---
// Updated to be more flexible for deployment on different GitHub Pages URLs or Codespaces.
app.use('/api/*', cors({
  origin: (origin) => {
    if (!origin) {
      return undefined; // Block requests with no origin
    }
    const hostname = new URL(origin).hostname;
    // Allow common development and GitHub hosting platforms
    if (
      hostname.endsWith('.github.io') ||
      hostname.endsWith('.github.dev') || // For Codespaces
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') || // Handle Vite dev server
      hostname === '127.0.0.1'
    ) {
      return origin;
    }
    return undefined; // Deny all other origins
  },
  allowHeaders: ['Content-Type'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  credentials: true,
  maxAge: 86400,
}));


// --- Authentication Routes ---

app.post('/api/login', async (c) => {
  if (!c.env.ADMIN_USERNAME || !c.env.ADMIN_PASSWORD || !c.env.SESSION_KV) {
    console.error('Server not configured: Missing ADMIN_USERNAME, ADMIN_PASSWORD, or SESSION_KV binding.');
    return c.json({ success: false, error: 'Server is not configured correctly. Please contact the administrator.' }, 503);
  }

  const { username, password } = await c.req.json();

  if (username === c.env.ADMIN_USERNAME && password === c.env.ADMIN_PASSWORD) {
    const sessionId = crypto.randomUUID();
    await c.env.SESSION_KV.put(sessionId, 'admin', { expirationTtl: 86400 }); // 24-hour session
    setCookie(c, 'session_id', sessionId, {
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'None', // Use 'None' for cross-site cookies, requires 'secure: true'
      maxAge: 86400,
    });
    return c.json({ success: true });
  }
  return c.json({ success: false, error: 'Invalid username or password.' }, 401);
});

app.post('/api/logout', async (c) => {
  if (c.env.SESSION_KV) {
    const sessionId = getCookie(c, 'session_id');
    if (sessionId) {
      await c.env.SESSION_KV.delete(sessionId);
    }
  } else {
    console.error('Server not configured: Missing SESSION_KV binding. Cannot delete session from KV.');
  }
  deleteCookie(c, 'session_id', { path: '/', secure: true, httpOnly: true, sameSite: 'None' });
  return c.json({ success: true });
});

app.get('/api/session', async (c) => {
  if (!c.env.SESSION_KV) {
    console.error('Server not configured: Missing SESSION_KV binding.');
    return c.json({ error: 'Server session storage not configured.' }, 503);
  }
  const sessionId = getCookie(c, 'session_id');
  if (sessionId) {
    const userRole = await c.env.SESSION_KV.get(sessionId);
    if (userRole === 'admin') {
      return c.json({ isLoggedIn: true });
    }
  }
  return c.json({ isLoggedIn: false });
});

// --- Chat Route ---

app.post('/api/chat', async (c) => {
  if (!c.env.GEMINI_API_KEY) {
      console.error('Server not configured: Missing GEMINI_API_KEY.');
      return c.json({ text: "Server is not configured correctly. The Gemini API key is missing." }, 503);
  }

  try {
    const body = await c.req.json();
    const history = body.history as Message[];
    const newUserMessage = body.newUserMessage as Message;

    if (!Array.isArray(history) || !newUserMessage || typeof newUserMessage.text !== 'string') {
        return c.json({ text: "Invalid request format." }, 400);
    }
  
    const sessionId = getCookie(c, 'session_id');
    const userRole = sessionId && c.env.SESSION_KV ? await c.env.SESSION_KV.get(sessionId) : null;
    const isAdmin = userRole === 'admin';

    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    const model = 'gemini-2.5-flash';

    const config: {
        systemInstruction: string;
        tools?: { functionDeclarations: FunctionDeclaration[] }[];
    } = {
        systemInstruction: getSystemInstruction(isAdmin),
    };

    if (isAdmin) {
        config.tools = [{ functionDeclarations: [createInvoiceTool, manageInventoryTool, sendTelegramReportTool] }];
    }

    const chat: Chat = ai.chats.create({
        model,
        config,
        history: history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }],
        })),
    });

    let response: GenerateContentResponse = await chat.sendMessage({ message: newUserMessage.text });

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        let functionResult;

        console.log("Executing function call:", call.name, call.args);

        if (call.name === 'create_invoice') {
            functionResult = await createInvoice(c, call.args as any);
        } else if (call.name === 'manage_inventory') {
            functionResult = await manageInventory(c, call.args as any);
        } else if (call.name === 'send_telegram_report') {
            functionResult = await sendTelegramReport(c, call.args as any);
        } else {
            functionResult = { success: false, error: 'Unknown function' };
        }

        const toolResponseParts: Part[] = [
          {
            functionResponse: {
              name: call.name,
              response: functionResult,
            },
          },
        ];
        response = await chat.sendMessage({ message: toolResponseParts });
    }

    return c.json({ text: response.text });

  } catch (error: any) {
    console.error("Error processing chat:", error);
    // Check for specific Gemini API errors if possible, otherwise send a generic one.
    const errorMessage = error.message?.includes('API key not valid') 
      ? "The configured Gemini API key is invalid. Please check the server configuration."
      : "Sorry, an error occurred while communicating with the AI. Please try again later.";
    return c.json({ text: errorMessage }, 500);
  }
});


// --- System Prompt & Tool Definitions ---

const getSystemInstruction = (isAdmin: boolean): string => {
  const baseInstruction = `You are a professional, friendly, and helpful AI assistant for a business named 'Gangan Adul's Business'. 
Your goal is to answer customer questions accurately and concisely based ONLY on the information provided here.
Do not make up information. If a question falls outside this scope, politely state that you don't have the information and suggest they email support@ganganadul.com.

**Business Information:**
- **Name:** Gangan Adul's Business
- **Products:** We sell high-quality, handcrafted leather goods. Our main products are wallets, belts, and bags. All items are made from genuine leather.
- **Store Hours:** Our physical store is open from 9 AM to 6 PM, Monday to Friday. Our online store is open 24/7.
- **Return Policy:** We have a 30-day return policy for unused items in their original packaging. The customer must have a receipt for a full refund.
- **Contact:** For complex issues or order-specific questions, please ask the customer to email our support team at support@ganganadul.com.
- **Location:** We are an online store, but we have one physical retail location. Do not invent an address.
- **Backend System:** This business uses a backend system hosted at ginginv2.realganganadul.workers.dev.`;

  if (isAdmin) {
    return `${baseInstruction}\n
---
**ADMIN INSTRUCTIONS**
You are now speaking to an authorized ADMIN. You have access to advanced capabilities.
You can assist with office tasks by interacting with a Google Spreadsheet and Telegram.
- To create an invoice, you MUST use the 'create_invoice' function.
- To manage inventory, you MUST use the 'manage_inventory' function.
- To send a report via Telegram, you MUST use the 'send_telegram_report' function.
When a task is completed successfully, confirm it to the admin clearly.`;
  }
  return `${baseInstruction}\n
---
**CUSTOMER SERVICE INSTRUCTIONS**
You are speaking to a customer. Provide excellent customer service using only the business information provided above. You cannot perform administrative tasks. Do not mention the admin functions or tools to customers.`;
};

// Tool definitions for Gemini
const createInvoiceTool: FunctionDeclaration = {
  name: 'create_invoice',
  description: 'Creates a new invoice in the Google Sheet.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      customerName: { type: Type.STRING, description: 'The name of the customer.' },
      items: {
        type: Type.ARRAY,
        description: 'A list of items purchased.',
        items: { type: Type.STRING }
      },
      totalAmount: { type: Type.NUMBER, description: 'The total amount of the invoice.' },
    },
    required: ['customerName', 'items', 'totalAmount'],
  },
};

const manageInventoryTool: FunctionDeclaration = {
  name: 'manage_inventory',
  description: 'Updates the stock level of an item in the inventory sheet.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      itemName: { type: Type.STRING, description: 'The name of the item to update.' },
      quantityChange: { type: Type.INTEGER, description: 'The change in quantity (e.g., -1 for a sale, 10 for a restock).' },
    },
    required: ['itemName', 'quantityChange'],
  },
};

const sendTelegramReportTool: FunctionDeclaration = {
  name: 'send_telegram_report',
  description: 'Sends a daily summary or report to the admin via Telegram.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reportContent: { type: Type.STRING, description: 'The text content of the report to be sent.' },
    },
    required: ['reportContent'],
  },
};


// --- Tool Implementation ---

// Google Sheets Helper
async function getGoogleAuthToken(c: any): Promise<string | null> {
  if (!c.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.error('Missing binding: GOOGLE_SERVICE_ACCOUNT_JSON');
    return null;
  }
  try {
    const serviceAccount = JSON.parse(c.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const auth = new GoogleAuth({
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const authToken = await auth.getAccessToken();
    if (!authToken) throw new Error('Failed to authenticate with Google');
    return authToken;
  } catch(e) {
    console.error('Error parsing GOOGLE_SERVICE_ACCOUNT_JSON or getting auth token', e);
    return null;
  }
}

// Invoice creation function
async function createInvoice(c: any, { customerName, items, totalAmount }: { customerName: string; items: string[]; totalAmount: number; }) {
  if (!c.env.SPREADSHEET_ID) return { success: false, error: 'Server configuration error: SPREADSHEET_ID is not set.'};
  try {
    const authToken = await getGoogleAuthToken(c);
    if (!authToken) return { success: false, error: 'Server configuration error: Could not authenticate with Google Sheets.' };

    const sheetName = 'Invoices';
    const values = [[new Date().toISOString(), customerName, items.join(', '), totalAmount]];
    
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${c.env.SPREADSHEET_ID}/values/${sheetName}!A1:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google Sheets API Error: ${JSON.stringify(error)}`);
    }

    return { success: true, message: `Invoice for ${customerName} created successfully.` };
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return { success: false, error: error.message };
  }
}

// Inventory management function
async function manageInventory(c: any, { itemName, quantityChange }: { itemName: string; quantityChange: number; }) {
  if (!c.env.SPREADSHEET_ID) return { success: false, error: 'Server configuration error: SPREADSHEET_ID is not set.'};
  try {
    const authToken = await getGoogleAuthToken(c);
    if (!authToken) return { success: false, error: 'Server configuration error: Could not authenticate with Google Sheets.' };

    const sheetName = 'Inventory';
    const range = `${sheetName}!A:B`;

    const getResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${c.env.SPREADSHEET_ID}/values/${range}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
    });
    if (!getResponse.ok) throw new Error('Failed to read inventory data.');
    const data = await getResponse.json();
    const rows: string[][] = data.values || [];
    
    const itemRowIndex = rows.findIndex(row => row[0]?.toLowerCase() === itemName.toLowerCase());
    
    if (itemRowIndex === -1) {
        return { success: false, message: `Item '${itemName}' not found in inventory.` };
    }
    
    const currentQuantity = parseInt(rows[itemRowIndex][1] || '0', 10);
    const newQuantity = currentQuantity + quantityChange;

    const updateRange = `${sheetName}!B${itemRowIndex + 1}`;
    const updateResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${c.env.SPREADSHEET_ID}/values/${updateRange}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [[newQuantity]] }),
    });

    if (!updateResponse.ok) {
        const error = await updateResponse.json();
        throw new Error(`Google Sheets API Error: ${JSON.stringify(error)}`);
    }

    return { success: true, message: `Inventory for ${itemName} updated to ${newQuantity}.` };
  } catch (error: any) {
    console.error('Error managing inventory:', error);
    return { success: false, error: error.message };
  }
}

// Telegram reporting function
async function sendTelegramReport(c: any, { reportContent }: { reportContent: string; }) {
  if (!c.env.TELEGRAM_BOT_TOKEN || !c.env.TELEGRAM_CHAT_ID) {
    return { success: false, error: 'Server configuration error: Telegram bot token or chat ID is not set.' };
  }
  try {
    const url = `https://api.telegram.org/bot${c.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: c.env.TELEGRAM_CHAT_ID,
        text: reportContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Telegram API Error: ${JSON.stringify(error)}`);
    }

    return { success: true, message: 'Report sent to Telegram successfully.' };
  } catch (error: any) {
    console.error('Error sending Telegram report:', error);
    return { success: false, error: error.message };
  }
}

export default app;
