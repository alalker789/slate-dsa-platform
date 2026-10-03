import { redis } from "../config/redis.js";

const mem = new Map(); // key -> { v, exp }
const inflight = new Map(); // key -> Promise  (stampede protection)

/** cached(key, ttlSeconds, loader): read-through cache, shared via Redis when available. */
export async function cached(key, ttlSec, loader) {
  if (redis) {
    const hit = await redis.get(key).catch(() => null);
    if (hit) return JSON.parse(hit);
  } else {
    const hit = mem.get(key);
    if (hit && hit.exp > Date.now()) return hit.v;
  }
  if (inflight.has(key)) return inflight.get(key); // N concurrent misses -> 1 DB query
  const p = (async () => {
    const value = await loader();
    if (redis) await redis.set(key, JSON.stringify(value), "EX", ttlSec).catch(() => {});
    else mem.set(key, { v: value, exp: Date.now() + ttlSec * 1000 });
    return value;
  })().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export async function invalidate(key) {
  mem.delete(key);
  if (redis) await redis.del(key).catch(() => {});
}
