"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPostalCodeHtml = fetchPostalCodeHtml;
const axios_1 = __importStar(require("axios"));
const qs_1 = __importDefault(require("qs"));
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Sends a POST request to Pos Indonesia CariKodepos endpoint with retry logic.
 */
async function fetchPostalCodeHtml(keyword, cookie) {
    const URL = 'https://kodepos.posindonesia.co.id/CariKodepos';
    const payload = qs_1.default.stringify({ kodepos: keyword });
    let lastError = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await axios_1.default.post(URL, payload, {
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
            lastError = error instanceof Error ? error : new Error(String(error));
            if (error instanceof axios_1.AxiosError) {
                if (error.response?.status === 401 || error.response?.status === 403) {
                    throw new Error(`Authentication failed for ${keyword}: ${lastError.message}`);
                }
            }
            if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY * attempt);
            }
        }
    }
    throw new Error(`Failed to fetch data for ${keyword} after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}
//# sourceMappingURL=PosIndonesiaApi.js.map