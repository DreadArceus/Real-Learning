import { coerce, z } from "zod";

const ConfigSchema = z.object({
  PORT: z.string().transform(Number).pipe(z.number().positive().default(3001)),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_PATH: z.string().default("./data/status.db"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  API_RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform(Number)
    .pipe(
      z
        .number()
        .positive()
        .default(15 * 60 * 1000)
    ),
  API_RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .transform(Number)
    .pipe(z.number().positive().default(100)),
  JWT_SECRET: z.string().default("your-secret-key-change-in-production"),
  JWT_EXPIRES_IN: z.string().default("24h"),
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
        LOG_LEVEL: "info",
        API_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
        API_RATE_LIMIT_MAX_REQUESTS: 100,
        JWT_SECRET: "test-secret-key",
        JWT_EXPIRES_IN: "24h",
      };
    }
    throw error;
  }
}

export const config = loadConfig();

export const isDevelopment = config.NODE_ENV === "development";
export const isProduction = config.NODE_ENV === "production";
export const isTest = config.NODE_ENV === "test";
