"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LimitSchema = exports.UserIdSchema = exports.UpdateStatusSchema = exports.CreateStatusSchema = void 0;
const zod_1 = require("zod");
exports.CreateStatusSchema = zod_1.z.object({
    lastWaterIntake: zod_1.z.string().datetime({
        message: 'lastWaterIntake must be a valid ISO datetime string'
    }),
    altitude: zod_1.z.number().int().min(1).max(10, {
        message: 'altitude must be between 1 and 10'
    })
});
exports.UpdateStatusSchema = zod_1.z.object({
    lastWaterIntake: zod_1.z.string().datetime({
        message: 'lastWaterIntake must be a valid ISO datetime string'
    }).optional(),
    altitude: zod_1.z.number().int().min(1).max(10, {
        message: 'altitude must be between 1 and 10'
    }).optional()
}).refine((data) => data.lastWaterIntake !== undefined || data.altitude !== undefined, {
    message: 'At least one field (lastWaterIntake or altitude) must be provided'
});
exports.UserIdSchema = zod_1.z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, {
    message: 'userId must contain only alphanumeric characters, hyphens, and underscores'
});
exports.LimitSchema = zod_1.z.number().int().min(1).max(100);
//# sourceMappingURL=statusSchemas.js.map