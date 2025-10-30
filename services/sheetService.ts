import { BusinessData } from '../types';

// This is the URL provided by the user for their Cloudflare worker.
const WORKER_URL = 'https://ginginv2.realganganadul.workers.dev/';

export const fetchBusinessData = async (): Promise<BusinessData> => {
    try {
        const response = await fetch(WORKER_URL);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Worker request failed with status ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        // Here you might add validation to ensure the data has the correct shape.
        return data as BusinessData;
    } catch (error) {
        console.error("Error fetching data from Cloudflare worker:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch business data. Worker error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while fetching business data.");
    }
};
