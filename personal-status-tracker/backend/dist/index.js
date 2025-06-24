"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const status_1 = __importDefault(require("./routes/status"));
const errorHandler_1 = require("./middleware/errorHandler");
const config_1 = require("./config");
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
app.use((0, cors_1.default)({
    origin: config_1.config.FRONTEND_URL,
    credentials: true
}));
// Logging
app.use((0, morgan_1.default)(config_1.isDevelopment ? 'dev' : 'combined'));
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Personal Status Tracker API is running',
        data: {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
            environment: config_1.config.NODE_ENV
        }
    });
});
// API routes
app.use('/api/status', status_1.default);
// 404 handler
app.use(errorHandler_1.notFoundHandler);
// Error handler (must be last)
app.use(errorHandler_1.errorHandler);
// Graceful shutdown
const gracefulShutdown = () => {
    console.log('Received shutdown signal, closing server...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
// Start server
const server = app.listen(config_1.config.PORT, () => {
    console.log(`🚀 Personal Status Tracker API running on port ${config_1.config.PORT}`);
    console.log(`📊 Health check: http://localhost:${config_1.config.PORT}/health`);
    console.log(`📈 API endpoints: http://localhost:${config_1.config.PORT}/api/status`);
    console.log(`🌍 Environment: ${config_1.config.NODE_ENV}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map