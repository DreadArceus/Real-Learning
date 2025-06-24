"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const StatusService_1 = require("../services/StatusService");
const validateRequest_1 = require("../middleware/validateRequest");
const statusSchemas_1 = require("../schemas/statusSchemas");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const statusService = new StatusService_1.StatusService();
const GetStatusQuerySchema = zod_1.z.object({
    userId: statusSchemas_1.UserIdSchema.optional().default('default_user')
});
// GET /api/status - Get latest status
router.get('/', (0, validateRequest_1.validateRequest)(GetStatusQuerySchema, 'query'), async (req, res, next) => {
    try {
        const { userId } = req.query;
        const status = await statusService.getLatestStatus(userId);
        res.json({
            success: true,
            data: status
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/status - Create new status entry
router.post('/', (0, validateRequest_1.validateRequest)(GetStatusQuerySchema, 'query'), (0, validateRequest_1.validateRequest)(statusSchemas_1.CreateStatusSchema, 'body'), async (req, res, next) => {
    try {
        const { userId } = req.query;
        const status = await statusService.createStatus(req.body, userId);
        res.status(201).json({
            success: true,
            data: status,
            message: 'Status created successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/status - Update status (creates new entry)
router.put('/', (0, validateRequest_1.validateRequest)(GetStatusQuerySchema, 'query'), (0, validateRequest_1.validateRequest)(statusSchemas_1.UpdateStatusSchema, 'body'), async (req, res, next) => {
    try {
        const { userId } = req.query;
        const status = await statusService.updateStatus(req.body, userId);
        res.json({
            success: true,
            data: status,
            message: 'Status updated successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
const GetHistoryQuerySchema = zod_1.z.object({
    userId: statusSchemas_1.UserIdSchema.optional().default('default_user'),
    limit: zod_1.z.string().transform(Number).pipe(statusSchemas_1.LimitSchema).optional().default('10')
});
// GET /api/status/history - Get status history
router.get('/history', (0, validateRequest_1.validateRequest)(GetHistoryQuerySchema, 'query'), async (req, res, next) => {
    try {
        const { userId, limit } = req.query;
        const history = await statusService.getStatusHistory(userId, limit);
        res.json({
            success: true,
            data: history
        });
    }
    catch (error) {
        next(error);
    }
});
// DELETE /api/status - Delete all status entries for user
router.delete('/', (0, validateRequest_1.validateRequest)(GetStatusQuerySchema, 'query'), async (req, res, next) => {
    try {
        const { userId } = req.query;
        await statusService.deleteAllStatus(userId);
        res.json({
            success: true,
            message: 'All status entries deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/status/stats - Get user statistics
router.get('/stats', (0, validateRequest_1.validateRequest)(GetStatusQuerySchema, 'query'), async (req, res, next) => {
    try {
        const { userId } = req.query;
        const stats = await statusService.getUserStats(userId);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=status.js.map