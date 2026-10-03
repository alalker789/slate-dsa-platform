import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

export async function connectDb() {
  mongoose.set("strictQuery", true);
  // Each worker keeps its own pool. Total connections = workers x replicas x poolSize.
  await mongoose.connect(env.mongoUri, {
    maxPoolSize: env.mongoPoolSize,
    serverSelectionTimeoutMS: 8000,
    autoIndex: !env.isProd, // in production, indexes are built by `npm run seed` (syncIndexes)
  });
  logger.info("MongoDB connected");
}

export const disconnectDb = () => mongoose.disconnect();
