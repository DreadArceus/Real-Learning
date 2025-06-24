import { CreateStatusInput, UpdateStatusInput } from '../schemas/statusSchemas';
import { StatusData } from '../types';
export declare class StatusService {
    private statusModel;
    constructor();
    getLatestStatus(userId: string): Promise<StatusData | null>;
    createStatus(data: CreateStatusInput, userId: string): Promise<StatusData>;
    updateStatus(data: UpdateStatusInput, userId: string): Promise<StatusData>;
    getStatusHistory(userId: string, limit: number): Promise<StatusData[]>;
    deleteAllStatus(userId: string): Promise<boolean>;
    getUserStats(userId: string): Promise<{
        totalEntries: number;
        averageAltitude: number;
        lastActivityDate: string | null;
    }>;
}
//# sourceMappingURL=StatusService.d.ts.map