"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTest = exports.isProduction = exports.isDevelopment = exports.config = void 0;
const zod_1 = require("zod");
const ConfigSchema = zod_1.z.object({
    PORT: zod_1.z.string().transform(Number).pipe(zod_1.z.number().positive().default(3001)),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    FRONTEND_URL: zod_1.z.string().url().default('http://localhost:3000'),
    DATABASE_PATH: zod_1.z.string().default('./data/status.db'),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    API_RATE_LIMIT_WINDOW_MS: zod_1.z.string().transform(Number).pipe(zod_1.z.number().positive().default(15 * 60 * 1000)),
    API_RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().transform(Number).pipe(zod_1.z.number().positive().default(100))
});
function loadConfig() {
    try {
        return ConfigSchema.parse(process.env);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            console.error('Configuration validation failed:');
            error.errors.forEach(err => {
                console.error(`  ${err.path.join('.')}: ${err.message}`);
            });
            // Don't exit in test environment
            if (process.env.NODE_ENV !== 'test') {
                process.exit(1);
            }
            // Return default config for tests
            return {
                PORT: 3001,
                NODE_ENV: 'test',
                FRONTEND_URL: 'http://localhost:3000',
                DATABASE_PATH: './data/test.db',
                LOG_LEVEL: 'info',
                API_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
                API_RATE_LIMIT_MAX_REQUESTS: 100
            };
        }
        throw error;
    }
}
exports.config = loadConfig();
exports.isDevelopment = exports.config.NODE_ENV === 'development';
exports.isProduction = exports.config.NODE_ENV === 'production';
exports.isTest = exports.config.NODE_ENV === 'test';
//# sourceMappingURL=index.js.map