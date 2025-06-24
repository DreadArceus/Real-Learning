"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusService = void 0;
const StatusModel_1 = require("../models/StatusModel");
const AppError_1 = require("../errors/AppError");
class StatusService {
    constructor() {
        this.statusModel = new StatusModel_1.StatusModel();
    }
    async getLatestStatus(userId) {
        try {
            return await this.statusModel.getLatestStatus(userId);
        }
        catch (error) {
            throw new AppError_1.DatabaseError('Failed to retrieve latest status', error instanceof Error ? error : undefined);
        }
    }
    async createStatus(data, userId) {
        try {
            const statusData = {
                ...data,
                lastUpdated: new Date().toISOString(),
                userId
            };
            return await this.statusModel.createStatus(statusData, userId);
        }
        catch (error) {
            throw new AppError_1.DatabaseError('Failed to create status', error instanceof Error ? error : undefined);
        }
    }
    async updateStatus(data, userId) {
        try {
            // First check if user has any existing status
            const existingStatus = await this.statusModel.getLatestStatus(userId);
            if (!existingStatus) {
                throw new AppError_1.NotFoundError('No existing status found for user. Create a status first.');
            }
            const statusData = {
                ...data,
                lastUpdated: new Date().toISOString()
            };
            const updatedStatus = await this.statusModel.updateStatus(statusData, userId);
            if (!updatedStatus) {
                throw new AppError_1.DatabaseError('Failed to update status - no data returned');
            }
            return updatedStatus;
        }
        catch (error) {
            if (error instanceof AppError_1.NotFoundError) {
                throw error;
            }
            throw new AppError_1.DatabaseError('Failed to update status', error instanceof Error ? error : undefined);
        }
    }
    async getStatusHistory(userId, limit) {
        try {
            return await this.statusModel.getStatusHistory(userId, limit);
        }
        catch (error) {
            throw new AppError_1.DatabaseError('Failed to retrieve status history', error instanceof Error ? error : undefined);
        }
    }
    async deleteAllStatus(userId) {
        try {
            const result = await this.statusModel.deleteAllStatus(userId);
            if (!result) {
                throw new AppError_1.NotFoundError('No status entries found for user');
            }
            return result;
        }
        catch (error) {
            if (error instanceof AppError_1.NotFoundError) {
                throw error;
            }
            throw new AppError_1.DatabaseError('Failed to delete status entries', error instanceof Error ? error : undefined);
        }
    }
    async getUserStats(userId) {
        try {
            const history = await this.statusModel.getStatusHistory(userId, 1000);
            if (history.length === 0) {
                return {
                    totalEntries: 0,
                    averageAltitude: 0,
                    lastActivityDate: null
                };
            }
            const averageAltitude = history.reduce((sum, entry) => sum + entry.altitude, 0) / history.length;
            const lastActivityDate = history[0].lastUpdated;
            return {
                totalEntries: history.length,
                averageAltitude: Math.round(averageAltitude * 100) / 100,
                lastActivityDate
            };
        }
        catch (error) {
            throw new AppError_1.DatabaseError('Failed to retrieve user statistics', error instanceof Error ? error : undefined);
        }
    }
}
exports.StatusService = StatusService;
//# sourceMappingURL=StatusService.js.map