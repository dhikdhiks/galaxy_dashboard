import { Db, MongoClient, type MongoClientOptions } from "mongodb";

/**
 * Shared MongoDB client for Server Components, Route Handlers and Server Actions.
 *
 * The connection promise is cached on `globalThis` so Next.js dev hot reload
 * reuses one client instead of exhausting the connection pool.
 *
 * Resolution is lazy: importing this module never throws, so `next build`
 * succeeds even when `MONGODB_URI` is not configured yet.
 */

const DEFAULT_DB_NAME = "skill_galaxy";

/**
 * Timeouts chosen from measured connect times on this network: a healthy
 * connect is ~400ms, but intermittent SYN loss on the local egress path
 * stalls ~3.5% of cold connects for 3-8s.
 *
 * `serverSelectionTimeoutMS` is the real cap on how long a page can block —
 * within that budget the driver retries every SRV host on its own, so no
 * application-level retry is layered on top (that would simply double it).
 */
const CLIENT_OPTIONS: MongoClientOptions = {
  maxPoolSize: 10,
  connectTimeoutMS: 5000,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  retryWrites: true,
};

/** Extra attempts are only made for failures that came back this fast (ms). */
const FAST_FAILURE_MS = 1500;
const RETRY_DELAY_MS = 250;

/**
 * How long a rejected connection promise is remembered before a fresh one is
 * allowed.
 *
 * Two reasons:
 *  - `src/proxy.ts` checks the database and then the page reads it. Without a
 *    shared failure, an unreachable database costs the full server-selection
 *    timeout twice (~20s per request, ~40s on `/groups/*`).
 *  - It must NOT be cached forever: a single blip would otherwise poison
 *    every later request until the process restarts.
 */
const FAILURE_CACHE_MS = 3000;

declare global {
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function createClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env.local and set MONGODB_URI, " +
        "or add it in Vercel project settings.",
    );
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt++) {
    if (attempt > 1) {
      await sleep(RETRY_DELAY_MS);
    }

    const startedAt = Date.now();
    const client = new MongoClient(uri, CLIENT_OPTIONS);

    try {
      return await client.connect();
    } catch (error) {
      lastError = error;
      // Never leave a half-open socket behind on a failed attempt.
      await client.close().catch(() => undefined);

      // A slow failure means server selection already spent its budget
      // trying every host — retrying would only add another full timeout.
      if (Date.now() - startedAt > FAST_FAILURE_MS) break;
    }
  }

  throw lastError;
}

function getClientPromise(): Promise<MongoClient> {
  if (!globalThis.__mongoClientPromise) {
    const promise = createClientPromise();
    globalThis.__mongoClientPromise = promise;

    void promise.catch(() => {
      if (globalThis.__mongoClientPromise !== promise) return;

      // Hold the rejection briefly (see FAILURE_CACHE_MS), then let the next
      // request start over so recovery needs no restart.
      setTimeout(() => {
        if (globalThis.__mongoClientPromise === promise) {
          globalThis.__mongoClientPromise = undefined;
        }
      }, FAILURE_CACHE_MS).unref?.();
    });
  }

  return globalThis.__mongoClientPromise;
}

/**
 * Start (but do not await) the cold connect. Called from
 * `src/instrumentation.ts` so the SRV/TCP/TLS/auth cost — and any stall —
 * is paid at boot instead of on the first page request.
 */
export function warmConnection(): void {
  void getClientPromise().catch(() => undefined);
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DB || DEFAULT_DB_NAME);
}
