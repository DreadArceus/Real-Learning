export interface StatusData {
    id?: number;
    userId?: string;
    lastWaterIntake: string;
    altitude: number;
    lastUpdated: string;
    createdAt?: string;
}
export interface CreateStatusRequest {
    lastWaterIntake: string;
    altitude: number;
}
export interface UpdateStatusRequest {
    lastWaterIntake?: string;
    altitude?: number;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    code?: string;
}
//# sourceMappingURL=index.d.ts.map