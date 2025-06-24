"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const AppError_1 = require("../errors/AppError");
const validateRequest = (schema, type = 'body') => {
    return (req, res, next) => {
        try {
            const dataToValidate = req[type];
            const validatedData = schema.parse(dataToValidate);
            // Replace the original data with validated data
            req[type] = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errorMessage = error.errors
                    .map(err => `${err.path.join('.')}: ${err.message}`)
                    .join(', ');
                return next(new AppError_1.ValidationError(errorMessage));
            }
            next(error);
        }
    };
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=validateRequest.js.map