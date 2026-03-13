import axios from 'axios';
import qs from 'qs';
/**
 * Sends a POST request to Pos Indonesia CariKodepos endpoint.
 * @param keyword - The search keyword (village name or postal code)
 * @param cookie - Optional session cookie
 * @returns The raw HTML response
 */
export async function fetchPostalCodeHtml(keyword, cookie) {
    const URL = 'https://kodepos.posindonesia.co.id/CariKodepos';
    const payload = qs.stringify({ kodepos: keyword });
    try {
        const response = await axios.post(URL, payload, {
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
        return response.data;
    }
    catch (error) {
        throw new Error(`Failed to fetch data for ${keyword}: ${error.message}`);
    }
}
//# sourceMappingURL=api.js.map