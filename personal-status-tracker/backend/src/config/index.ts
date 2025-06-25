import { coerce, z } from "zod";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const ConfigSchema = z.object({
  PORT: z.string().optional().transform(val => val ? Number(val) : 3001).pipe(z.number().positive()),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  FRONTEND_URL: z.string().optional().default("http://localhost:3000"),
  DATABASE_PATH: z.string().optional().default("./data/status.db"),
  DB_CONNECTION_TIMEOUT: z.string().optional().transform(val => val ? Number(val) : 30000).pipe(z.number().positive()),
  DB_BACKUP_ENABLED: z.string().optional().default('false').transform(val => val === 'true'),
  DB_BACKUP_INTERVAL: z.string().optional().transform(val => val ? Number(val) : 86400000).pipe(z.number().positive()),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  API_RATE_LIMIT_WINDOW_MS: z
    .string()
    .optional()
    .transform(val => val ? Number(val) : 15 * 60 * 1000)
    .pipe(z.number().positive()),
  API_RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .optional()
    .transform(val => val ? Number(val) : 100)
    .pipe(z.number().positive()),
  JWT_SECRET: z.string().optional().default("your-secret-key-change-in-production"),
  JWT_EXPIRES_IN: z.string().optional().default("24h"),
  // Additional configuration
  ALLOWED_ORIGINS: z.string().optional().default("http://localhost:3000"),
  TRUST_PROXY: z.string().optional().default('false').transform(val => val === 'true'),
  ENABLE_REQUEST_LOGGING: z.string().optional().default('true').transform(val => val === 'true'),
  REQUEST_TIMEOUT: z.string().optional().transform(val => val ? Number(val) : 30000).pipe(z.number().positive()),
  KEEP_ALIVE_TIMEOUT: z.string().optional().transform(val => val ? Number(val) : 65000).pipe(z.number().positive()),
  // Admin user configuration
  ADMIN_USERNAME: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
});

type Config = z.infer<typeof ConfigSchema>;

function loadConfig(): Config {
  try {
    return ConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Configuration validation failed: ");
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join(".")}: ${err.message}`);
      });

      // Don't exit in test environment
      if (process.env.NODE_ENV !== "test") {
        process.exit(1);
      }

      // Return default config for tests
      return {
        PORT: 3001,
        NODE_ENV: "test",
        FRONTEND_URL: "http://localhost:3000",
        DATABASE_PATH: "./data/test.db",
        DB_CONNECTION_TIMEOUT: 30000,
        DB_BACKUP_ENABLED: false,
        DB_BACKUP_INTERVAL: 86400000,
        LOG_LEVEL: "info",
        API_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
        API_RATE_LIMIT_MAX_REQUESTS: 100,
        JWT_SECRET: "test-secret-key",
        JWT_EXPIRES_IN: "24h",
        ALLOWED_ORIGINS: "http://localhost:3000",
        TRUST_PROXY: false,
        ENABLE_REQUEST_LOGGING: true,
        REQUEST_TIMEOUT: 30000,
        KEEP_ALIVE_TIMEOUT: 65000,
        ADMIN_USERNAME: undefined,
        ADMIN_PASSWORD: undefined,
      };
    }
    throw error;
  }
}

export const config = loadConfig();

export const isDevelopment = config.NODE_ENV === "development";
export const isProduction = config.NODE_ENV === "production";
export const isTest = config.NODE_ENV === "test";
