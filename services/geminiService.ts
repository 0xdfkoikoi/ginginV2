import { GoogleGenAI, Chat } from "@google/genai";
import { BusinessData, ChatMessage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chat: Chat | null = null;
let currentSystemInstruction: string = "";

const generateSystemInstruction = (data?: BusinessData): string => {
    const defaultData: BusinessData = {
        concept: "Mantik Coffee is a specialty coffee shop obsessed with the art of green bean processing. We focus on high-quality, single-origin beans and showcase various artisanal processing methods like natural, honey, and full washed. The vibe is cozy, modern, and space-themed. It's a great place to relax, work, or dive deep into the world of coffee.",
        signatureDrinks: [
            { name: 'Galaxy Latte', description: 'A latte with a hint of cardamom and beautiful latte art.' },
            { name: 'Celestial Cold Brew', description: 'A smooth, slow-steeped cold brew, very popular.' },
            { name: 'Meteor Mocha', description: 'A rich mocha made with dark chocolate from a local chocolatier.' },
        ],
        menuDescription: "We serve a full range of espresso drinks (lattes, cappuccinos, etc.), various pour-over options, and a selection of teas. We also have artisanal pastries, cakes, and light bites like avocado toast and sandwiches.",
        beans: "We specialize in meticulously processed arabica beans, offering a rotating selection of single-origins that highlight methods like natural, honey, full washed, and classic. We also feature a high-quality robusta for those who enjoy a bolder, richer flavor. Customers can buy bags of our current beans to take home and explore the unique tastes of each processing style.",
        openingHours: [
            { days: 'Monday to Friday', time: '7:00 AM - 6:00 PM' },
            { days: 'Saturday & Sunday', time: '8:00 AM - 5:00 PM' },
        ],
        location: "123 Astro Lane, Nebula City.",
        amenities: "We offer free, high-speed Wi-Fi. We have plenty of seating, including comfortable chairs and tables with power outlets.",
        events: "We sometimes host 'Stargazing Nights' with local astronomy clubs. Ask the customer to check our social media for schedules."
    };

    const info = data || defaultData;

    return `You are a friendly and enthusiastic AI assistant for "Mantik Coffee", a specialty coffee shop with a cozy, celestial theme. Your name is Cosmo.

Your goal is to answer customer questions accurately and in a warm, welcoming tone. Adhere strictly to the information provided below. Do not invent details. If you don't know the answer, politely say you need to check with the human baristas.

**Mantik Coffee Information:**
- **Concept:** ${info.concept}
- **Signature Drinks:**
${info.signatureDrinks.map(d => `  - ${d.name}: ${d.description}`).join('\n')}
- **Menu:** ${info.menuDescription}
- **Beans:** ${info.beans}
- **Opening Hours:**
${info.openingHours.map(h => `  - ${h.days}: ${h.time}`).join('\n')}
- **Location:** ${info.location}
- **Amenities:** ${info.amenities}
- **Events:** ${info.events}

**Your Persona:**
- Be cheerful and use emojis sparingly and appropriately (like ☕️, ✨, 🚀).
- Keep answers concise but informative.
- When the conversation starts, greet the user warmly and introduce yourself. For example: "Welcome to Mantik Coffee! I'm Cosmo, your friendly AI barista. How can I help you today? ✨"
`;
}

currentSystemInstruction = generateSystemInstruction();

const getChatInstance = (history: ChatMessage[]) => {
    if (!chat) {
        const geminiHistory = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));

        chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: currentSystemInstruction,
            },
            history: geminiHistory
        });
    }
    return chat;
}

export const sendMessageToAI = async (history: ChatMessage[], newMessage: string): Promise<string> => {
    try {
        const chatSession = getChatInstance(history);
        const response = await chatSession.sendMessage({ message: newMessage });
        return response.text;
    } catch (error) {
        console.error("Error sending message to AI:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to get response from AI. Gemini API error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while communicating with the AI.");
    }
};

export const updateSystemInstruction = (data: BusinessData): void => {
    currentSystemInstruction = generateSystemInstruction(data);
    chat = null; // Force recreation of chat instance on the next message to apply new instructions
};
