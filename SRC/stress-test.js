import http from 'k6/http';
import { check, sleep } from 'k6';

const isNumeric = (v) => /^\d+$/.test(v || '');
const default_vus = 5;

const target_vus_env = `${__ENV.TARGET_VUS}`;
const target_vus = isNumeric(target_vus_env) ? Number(target_vus_env) : default_vus;

// Change this to your API; avoid swapi.dev (expired cert)
const BASE_URL = __ENV.BASE_URL || 'https://test.k6.io';
const PATH = __ENV.PATH || '/';

export let options = {
    stages: [
        // Ramp-up from 1 to TARGET_VUS in 15s
        { duration: '15s', target: target_vus },
        // Stay at TARGET_VUS for 20s
        { duration: '20s', target: target_vus },
        // Ramp-down to 0 in 5s
        { duration: '5s', target: 0 },
    ],
    // If you MUST hit a host with a bad cert for a demo, uncomment:
    // insecureSkipTLSVerify: true,
};

export default function () {
    const res = http.get(`${BASE_URL}${PATH}`, { headers: { Accept: 'application/json' } });

    check(res, {
        'status is 200': (r) => r.status === 200,
        // 'json content-type': (r) => String(r.headers['Content-Type'] || '').includes('application/json'),
    });

    sleep(0.3);
}
