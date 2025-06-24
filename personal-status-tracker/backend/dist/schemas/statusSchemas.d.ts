import { z } from 'zod';
export declare const CreateStatusSchema: z.ZodObject<{
    lastWaterIntake: z.ZodString;
    altitude: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    lastWaterIntake: string;
    altitude: number;
}, {
    lastWaterIntake: string;
    altitude: number;
}>;
export declare const UpdateStatusSchema: z.ZodEffects<z.ZodObject<{
    lastWaterIntake: z.ZodOptional<z.ZodString>;
    altitude: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    lastWaterIntake?: string | undefined;
    altitude?: number | undefined;
}, {
    lastWaterIntake?: string | undefined;
    altitude?: number | undefined;
}>, {
    lastWaterIntake?: string | undefined;
    altitude?: number | undefined;
}, {
    lastWaterIntake?: string | undefined;
    altitude?: number | undefined;
}>;
export declare const UserIdSchema: z.ZodString;
export declare const LimitSchema: z.ZodNumber;
export type CreateStatusInput = z.infer<typeof CreateStatusSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
//# sourceMappingURL=statusSchemas.d.ts.map