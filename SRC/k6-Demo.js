import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
/*
export let options = { vus: 500, duration: '10m' };

export default function () {
    const res = http.get('https://jsonplaceholder.typicode.com/posts');
    check(res, { 'status is 200': (r) => r.status === 200 });
}
*/
// --- Custom error rate metric
/* =========================
   Custom metrics
========================= */
const error_rate = new Rate('error_rate');         // your app-defined error rate
const by_status  = new Counter('by_status');       // per-status breakdown
const api_time   = new Trend('api_time');          // response time trend

/* =========================
   Env + defaults
========================= */
const isNum = (v) => /^\d+(\.\d+)?$/.test(v || '');
const BASE_URL = __ENV.BASE_URL || 'https://httpbin.org';
const PATH     = __ENV.PATH     || '/status/200';           // always-OK default for KT
const TESTID   = __ENV.TESTID   || 'demo-local';

const START_RPS = isNum(__ENV.START_RPS) ? Number(__ENV.START_RPS) : 10;  // start rate
const RAMP_RPS  = isNum(__ENV.RAMP_RPS)  ? Number(__ENV.RAMP_RPS)  : 25;  // mid rate
const PEAK_RPS  = isNum(__ENV.PEAK_RPS)  ? Number(__ENV.PEAK_RPS)  : 50;  // peak rate

/* =========================
   Options (arrival-rate)
========================= */
export const options = {
    tags: { project: 'k6-kt', testid: TESTID },

    scenarios: {
        demo_rps: {
            executor: 'ramping-arrival-rate',   // model traffic by RPS (open model)
            timeUnit: '1s',
            startRate: START_RPS,
            preAllocatedVUs: Math.max(PEAK_RPS * 2, 50),  // headroom
            maxVUs: Math.max(PEAK_RPS * 4, 200),
            stages: [
                { target: RAMP_RPS, duration: '30s' },   // ramp to mid RPS
                { target: PEAK_RPS, duration: '60s' },   // hold peak
                { target: 0,        duration: '20s' },   // ramp down
            ],
            exec: 'api',
        },
    },

    thresholds: {
        // Built-in failure rate (non-2xx/3xx or network errors)
        http_req_failed: ['rate<0.01'],          // <1% failures
        // Your custom error rate (based on your checks/logic below)
        error_rate:      ['rate<0.01'],
        // Latency SLO (tune as needed)
        http_req_duration: ['p(95)<800'],
    },
};

/* =========================
   Core test logic
========================= */
export function api() {
    const url = `${BASE_URL}${PATH}`;
    let res = http.get(url, { headers: { Accept: 'application/json' } });

    // tiny retry (up to 2) to smooth transient blips
    if (!(res.status >= 200 && res.status < 300)) {
        for (let i = 0; i < 2; i += 1) {
            const r2 = http.get(url);
            if (r2.status >= 200 && r2.status < 300) { res = r2; break; }
        }
    }

    const ok = res.status >= 200 && res.status < 300;

    // metrics
    api_time.add(res.timings.duration);
    by_status.add(1, { status: String(res.status) });
    error_rate.add(!ok);

    // checks (non-blocking)
    check(res, {
        'status 2xx': () => ok,
    });

    // realistic pacing for VUs spawned by arrival rate
    sleep(0.2);
}