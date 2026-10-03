import pino from "pino";
import { env } from "./env.js";

export const logger = pino({
  level: process.env.LOG_LEVEL || (env.isProd ? "info" : "debug"),
  ...(env.isProd ? {} : { transport: { target: "pino-pretty", options: { colorize: true } } }),
});
