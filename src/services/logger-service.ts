import pino, {type LoggerOptions} from "pino";
import { env } from "../utils/env";

const isProduction = env.NODE_ENVIRONMENT === "production";
const isTest = env.NODE_ENVIRONMENT === "test";

export const pinoConfig: LoggerOptions = {
  level: isProduction ? "info" : "debug",
  base: {
    env: env.NODE_ENVIRONMENT,
  },
};

// Transport only in development (not in tests) and not on Vercel
if (!isProduction && !isTest && !process.env.VERCEL) {
  pinoConfig.transport = {
    target: "pino-pretty",
    options: {
      translateTime: "HH:MM:ss Z",
      ignore: "pid,hostname",
    },
  };
}

export const logger = pino(pinoConfig);
