// Shared Atlas connection settings for the CLI scripts (db:init / db:seed).
//
// The plain driver defaults turned out to be a footgun on this network: the
// egress path intermittently blackholes TCP SYNs, so a healthy ~400ms connect
// sometimes stalls for 3-8s and occasionally the full 30s `connectTimeoutMS`
// default (which is exactly what `npm run db:seed` used to hit). Shorter
// timeouts fail over to another Atlas SRV host instead of hanging, and one
// retry covers the roughly 1-in-30 transient failure.
//
// Keep these in sync with src/lib/mongodb.ts.

import { MongoClient } from "mongodb";

export const CLIENT_OPTIONS = {
  maxPoolSize: 10,
  connectTimeoutMS: 5000,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  retryWrites: true,
};

const CONNECT_ATTEMPTS = 2;
const RETRY_DELAY_MS = 250;

/**
 * CLI scripts always use the full retry budget: unlike a web request there is
 * no latency to protect, and this network fails roughly 1 run in 30. This is
 * deliberately stricter than the app path in `src/lib/mongodb.ts`, which only
 * retries fast failures so an unreachable database can never double a page's
 * timeout.
 */
export async function connect(uri) {
  let lastError;

  for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }

    const client = new MongoClient(uri, CLIENT_OPTIONS);
    try {
      return await client.connect();
    } catch (error) {
      lastError = error;
      await client.close().catch(() => {});
    }
  }

  throw lastError;
}
