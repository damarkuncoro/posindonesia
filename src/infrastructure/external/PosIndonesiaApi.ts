import axios, { AxiosError } from 'axios';
import qs from 'qs';
import { NetworkError } from '../../domain/errors/PostalCodeError.js';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sends a POST request to Pos Indonesia CariKodepos endpoint with retry logic.
 */
export async function fetchPostalCodeHtml(keyword: string, cookie?: string): Promise<string> {
    const URL = 'https://kodepos.posindonesia.co.id/CariKodepos';
    const payload = qs.stringify({ kodepos: keyword });
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await axios.post<string>(URL, payload, {
                headers: {
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'accept-language': 'en-US,en;q=0.9,id;q=0.8,ms;q=0.7',
                    'content-type': 'application/x-www-form-urlencoded',
                    'origin': 'https://kodepos.posindonesia.co.id',
                    'referer': 'https://kodepos.posindonesia.co.id/CariKodepos',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
                    'cookie': cookie || 'ci_session=siodf5sn3081n9fb1h3pfh7k8r92sjvt; TS011d97f9=01dc40192af9d2c68e0588cf6826f2541733c6f742d0e6382757bb95d8a2f8d27f6da94b22391892939703ae744a8f47fe7d578583'
                },
                timeout: 15000
            });
            
            if (!response.data || typeof response.data !== 'string') {
                throw new NetworkError(`Received invalid response format from Pos Indonesia API for keyword: ${keyword}`);
            }

            return response.data;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            
            if (error instanceof AxiosError) {
                const status = error.response?.status;
                if (status === 401 || status === 403) {
                    throw new NetworkError(`Authentication failed for ${keyword}. Please check your cookies.`, status);
                }
                if (status === 404) {
                    throw new NetworkError(`Pos Indonesia API endpoint not found.`, status);
                }
                if (status && status >= 500) {
                    throw new NetworkError(`Pos Indonesia server is currently experiencing issues (Status: ${status}).`, status);
                }
            }
            
            if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY * attempt);
            }
        }
    }
    
    throw new NetworkError(
        `Failed to fetch data for keyword "${keyword}" after ${MAX_RETRIES} attempts. Last error: ${lastError?.message}`
    );
}
