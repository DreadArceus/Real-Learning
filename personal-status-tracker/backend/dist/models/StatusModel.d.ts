import { StatusData, CreateStatusRequest, UpdateStatusRequest } from '../types';
export declare class StatusModel {
    private db;
    getLatestStatus(userId?: string): Promise<StatusData | null>;
    createStatus(data: CreateStatusRequest, userId?: string): Promise<StatusData>;
    updateStatus(data: UpdateStatusRequest, userId?: string): Promise<StatusData | null>;
    getStatusHistory(userId?: string, limit?: number): Promise<StatusData[]>;
    deleteAllStatus(userId?: string): Promise<boolean>;
}
//# sourceMappingURL=StatusModel.d.ts.map