import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { connectDb, disconnectDb } from "../config/db.js";
import { logger } from "../config/logger.js";
import { Algorithm } from "../models/Algorithm.js";
import { Card } from "../models/Card.js";
import { User } from "../models/User.js";
import { CardProgress } from "../models/CardProgress.js";
import { ReviewLog } from "../models/ReviewLog.js";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");
const load = (f) => JSON.parse(readFileSync(path.join(dir, f), "utf8"));

// Idempotent: upserts by slug, so re-running after editing the JSON updates content without touching user data.
async function upsertAll(Model, docs) {
  await Model.bulkWrite(docs.map((d) => ({ updateOne: { filter: { slug: d.slug }, update: { $set: d }, upsert: true } })));
}

await connectDb();
await upsertAll(Algorithm, load("algorithms.json"));
await upsertAll(Card, load("cards.json"));
await Promise.all([User, Algorithm, Card, CardProgress, ReviewLog].map((M) => M.syncIndexes()));
logger.info(`Seeded ${await Algorithm.countDocuments()} algorithms and ${await Card.countDocuments()} cards`);
await disconnectDb();
