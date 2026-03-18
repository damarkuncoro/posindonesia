import axios, { AxiosError } from 'axios';
import qs from 'qs';
import { NetworkError } from '../../domain/errors/PostalCodeError.js';
import { Logger, NoopLogger } from '../../domain/services/Logger.js';

export interface ApiConfig {
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
    logger?: Logger;
}

const DEFAULT_CONFIG: Required<ApiConfig> = {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 15000,
    logger: new NoopLogger()
};

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetches a fresh session cookie from the Pos Indonesia website.
 */
async function getFreshCookie(logger: Logger): Promise<string> {
    const URL = 'https://kodepos.posindonesia.co.id/CariKodepos';
    try {
        logger.debug('Fetching fresh session cookie...');
        const response = await axios.get(URL, {
            timeout: 10000,
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
            }
        });
        const cookies = response.headers['set-cookie'];
        if (cookies && cookies.length > 0) {
            const sessionCookie = cookies.find(c => c.startsWith('ci_session'));
            if (sessionCookie) {
                logger.info('Successfully obtained fresh session cookie.');
                return sessionCookie.split(';')[0];
            }
        }
        return '';
    } catch (error) {
        logger.warn('Failed to fetch fresh cookie, falling back to default.');
        return '';
    }
}

/**
 * Sends a POST request to Pos Indonesia CariKodepos endpoint with retry logic and configurable options.
 */
export async function fetchPostalCodeHtml(
    keyword: string, 
    cookie?: string,
    options: ApiConfig = {}
): Promise<string> {
    const config = { ...DEFAULT_CONFIG, ...options };
    const URL = 'https://kodepos.posindonesia.co.id/CariKodepos';
    const payload = qs.stringify({ kodepos: keyword });
    let activeCookie = cookie;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
        try {
            // Auto-fetch cookie if not provided and it's the first attempt or authentication failed
            if (!activeCookie && attempt === 1) {
                activeCookie = await getFreshCookie(config.logger);
            }

            config.logger.debug(`Fetching HTML for "${keyword}" (Attempt ${attempt}/${config.maxRetries})...`);
            
            const response = await axios.post<string>(URL, payload, {
                headers: {
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'accept-language': 'en-US,en;q=0.9,id;q=0.8,ms;q=0.7',
                    'content-type': 'application/x-www-form-urlencoded',
                    'origin': 'https://kodepos.posindonesia.co.id',
                    'referer': 'https://kodepos.posindonesia.co.id/CariKodepos',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
                    'cookie': activeCookie || 'ci_session=siodf5sn3081n9fb1h3pfh7k8r92sjvt'
                },
                timeout: config.timeout
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
                    config.logger.error(`Authentication failed for keyword "${keyword}": ${lastError.message}`);
                    throw new NetworkError(`Authentication failed for ${keyword}. Please check your cookies.`, status);
                }
                if (status === 404) {
                    throw new NetworkError(`Pos Indonesia API endpoint not found.`, status);
                }
                if (status && status >= 500) {
                    config.logger.warn(`Server side error (${status}) for "${keyword}". Attempt ${attempt}/${config.maxRetries}`);
                }
            }
            
            if (attempt < config.maxRetries) {
                const delay = config.retryDelay * attempt;
                config.logger.info(`Retrying in ${delay}ms...`);
                await sleep(delay);
            }
        }
    }
    
    config.logger.error(`Exhausted all retries for keyword "${keyword}".`);
    throw new NetworkError(
        `Failed to fetch data for keyword "${keyword}" after ${config.maxRetries} attempts. Last error: ${lastError?.message}`
    );
}
