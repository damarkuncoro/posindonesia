import { fetchPostalCodeHtml, parsePostalCodeTable } from '../src/main';

async function test() {
    const keywords = ['KEPULAUAN MENTAWAI', 'MENTAWAI', 'JAKARTA PUSAT', 'JAKARTA SELATAN'];
    const userCookie = 'ci_session=siodf5sn3081n9fb1h3pfh7k8r92sjvt; TS011d97f9=01dc40192af9d2c68e0588cf6826f2541733c6f742d0e6382757bb95d8a2f8d27f6da94b22391892939703ae744a8f47fe7d578583';

    for (const k of keywords) {
        try {
            console.log(`Testing: ${k}`);
            const html = await fetchPostalCodeHtml(k, userCookie);
            const results = parsePostalCodeTable(html);
            console.log(`Results for ${k}: ${results.length}`);
            if (results.length > 0) {
                console.log(`First result: ${JSON.stringify(results[0])}`);
            }
        } catch (e: any) {
            console.error(`Error for ${k}: ${e.message}`);
        }
    }
}

test();
