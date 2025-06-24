"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const StatusService_1 = require("../../services/StatusService");
const StatusModel_1 = require("../../models/StatusModel");
const AppError_1 = require("../../errors/AppError");
// Mock the StatusModel
jest.mock('../../models/StatusModel');
const MockedStatusModel = StatusModel_1.StatusModel;
describe('StatusService', () => {
    let statusService;
    let mockStatusModel;
    beforeEach(() => {
        jest.clearAllMocks();
        mockStatusModel = new MockedStatusModel();
        statusService = new StatusService_1.StatusService();
        // Replace the internal model with our mock
        statusService.statusModel = mockStatusModel;
    });
    const mockStatusData = {
        id: 1,
        userId: 'test_user',
        lastWaterIntake: '2024-01-15T12:00:00.000Z',
        altitude: 7,
        lastUpdated: '2024-01-15T12:00:00.000Z',
        createdAt: '2024-01-15T12:00:00.000Z'
    };
    describe('getLatestStatus', () => {
        it('should return latest status when found', async () => {
            mockStatusModel.getLatestStatus.mockResolvedValue(mockStatusData);
            const result = await statusService.getLatestStatus('test_user');
            expect(result).toEqual(mockStatusData);
            expect(mockStatusModel.getLatestStatus).toHaveBeenCalledWith('test_user');
        });
        it('should return null when no status found', async () => {
            mockStatusModel.getLatestStatus.mockResolvedValue(null);
            const result = await statusService.getLatestStatus('test_user');
            expect(result).toBeNull();
            expect(mockStatusModel.getLatestStatus).toHaveBeenCalledWith('test_user');
        });
        it('should throw DatabaseError when model throws', async () => {
            const originalError = new Error('Database connection failed');
            mockStatusModel.getLatestStatus.mockRejectedValue(originalError);
            await expect(statusService.getLatestStatus('test_user'))
                .rejects.toThrow(AppError_1.DatabaseError);
            await expect(statusService.getLatestStatus('test_user'))
                .rejects.toThrow('Failed to retrieve latest status');
        });
    });
    describe('createStatus', () => {
        const createInput = {
            lastWaterIntake: '2024-01-15T12:00:00.000Z',
            altitude: 7
        };
        it('should create status successfully', async () => {
            mockStatusModel.createStatus.mockResolvedValue(mockStatusData);
            const result = await statusService.createStatus(createInput, 'test_user');
            expect(result).toEqual(mockStatusData);
            expect(mockStatusModel.createStatus).toHaveBeenCalledWith(expect.objectContaining({
                ...createInput,
                userId: 'test_user',
                lastUpdated: expect.any(String)
            }), 'test_user');
        });
        it('should set lastUpdated timestamp', async () => {
            mockStatusModel.createStatus.mockResolvedValue(mockStatusData);
            const beforeTime = new Date().toISOString();
            await statusService.createStatus(createInput, 'test_user');
            const callArgs = mockStatusModel.createStatus.mock.calls[0][0];
            const afterTime = new Date().toISOString();
            expect(callArgs).toHaveProperty('lastUpdated');
            expect(callArgs.lastUpdated >= beforeTime).toBe(true);
            expect(callArgs.lastUpdated <= afterTime).toBe(true);
        });
        it('should throw DatabaseError when model throws', async () => {
            const originalError = new Error('Constraint violation');
            mockStatusModel.createStatus.mockRejectedValue(originalError);
            await expect(statusService.createStatus(createInput, 'test_user'))
                .rejects.toThrow(AppError_1.DatabaseError);
            await expect(statusService.createStatus(createInput, 'test_user'))
                .rejects.toThrow('Failed to create status');
        });
    });
    describe('updateStatus', () => {
        const updateInput = {
            altitude: 8
        };
        it('should update status when existing status found', async () => {
            mockStatusModel.getLatestStatus.mockResolvedValue(mockStatusData);
            mockStatusModel.updateStatus.mockResolvedValue({ ...mockStatusData, altitude: 8 });
            const result = await statusService.updateStatus(updateInput, 'test_user');
            expect(result.altitude).toBe(8);
            expect(mockStatusModel.getLatestStatus).toHaveBeenCalledWith('test_user');
            expect(mockStatusModel.updateStatus).toHaveBeenCalledWith(expect.objectContaining({
                ...updateInput,
                lastUpdated: expect.any(String)
            }), 'test_user');
        });
        it('should throw NotFoundError when no existing status', async () => {
            mockStatusModel.getLatestStatus.mockResolvedValue(null);
            await expect(statusService.updateStatus(updateInput, 'test_user'))
                .rejects.toThrow(AppError_1.NotFoundError);
            await expect(statusService.updateStatus(updateInput, 'test_user'))
                .rejects.toThrow('No existing status found for user');
            expect(mockStatusModel.updateStatus).not.toHaveBeenCalled();
        });
        it('should throw DatabaseError when model throws', async () => {
            mockStatusModel.getLatestStatus.mockResolvedValue(mockStatusData);
            const originalError = new Error('Database error');
            mockStatusModel.updateStatus.mockRejectedValue(originalError);
            await expect(statusService.updateStatus(updateInput, 'test_user'))
                .rejects.toThrow(AppError_1.DatabaseError);
        });
        it('should preserve NotFoundError from model', async () => {
            mockStatusModel.getLatestStatus.mockResolvedValue(mockStatusData);
            const notFoundError = new AppError_1.NotFoundError('Status');
            mockStatusModel.updateStatus.mockRejectedValue(notFoundError);
            await expect(statusService.updateStatus(updateInput, 'test_user'))
                .rejects.toThrow(AppError_1.NotFoundError);
            await expect(statusService.updateStatus(updateInput, 'test_user'))
                .rejects.toThrow('Status not found');
        });
    });
    describe('getStatusHistory', () => {
        const mockHistory = [mockStatusData, { ...mockStatusData, id: 2 }];
        it('should return status history', async () => {
            mockStatusModel.getStatusHistory.mockResolvedValue(mockHistory);
            const result = await statusService.getStatusHistory('test_user', 10);
            expect(result).toEqual(mockHistory);
            expect(mockStatusModel.getStatusHistory).toHaveBeenCalledWith('test_user', 10);
        });
        it('should return empty array when no history', async () => {
            mockStatusModel.getStatusHistory.mockResolvedValue([]);
            const result = await statusService.getStatusHistory('test_user', 10);
            expect(result).toEqual([]);
        });
        it('should throw DatabaseError when model throws', async () => {
            const originalError = new Error('Database error');
            mockStatusModel.getStatusHistory.mockRejectedValue(originalError);
            await expect(statusService.getStatusHistory('test_user', 10))
                .rejects.toThrow(AppError_1.DatabaseError);
        });
    });
    describe('deleteAllStatus', () => {
        it('should delete all status entries successfully', async () => {
            mockStatusModel.deleteAllStatus.mockResolvedValue(true);
            const result = await statusService.deleteAllStatus('test_user');
            expect(result).toBe(true);
            expect(mockStatusModel.deleteAllStatus).toHaveBeenCalledWith('test_user');
        });
        it('should throw NotFoundError when no entries to delete', async () => {
            mockStatusModel.deleteAllStatus.mockResolvedValue(false);
            await expect(statusService.deleteAllStatus('test_user'))
                .rejects.toThrow(AppError_1.NotFoundError);
            await expect(statusService.deleteAllStatus('test_user'))
                .rejects.toThrow('No status entries found for user');
        });
        it('should throw DatabaseError when model throws', async () => {
            const originalError = new Error('Database error');
            mockStatusModel.deleteAllStatus.mockRejectedValue(originalError);
            await expect(statusService.deleteAllStatus('test_user'))
                .rejects.toThrow(AppError_1.DatabaseError);
        });
    });
    describe('getUserStats', () => {
        it('should calculate stats for user with history', async () => {
            const mockHistory = [
                { ...mockStatusData, altitude: 8 },
                { ...mockStatusData, altitude: 6 },
                { ...mockStatusData, altitude: 7 }
            ];
            mockStatusModel.getStatusHistory.mockResolvedValue(mockHistory);
            const result = await statusService.getUserStats('test_user');
            expect(result).toEqual({
                totalEntries: 3,
                averageAltitude: 7, // (8 + 6 + 7) / 3 = 7
                lastActivityDate: mockStatusData.lastUpdated
            });
            expect(mockStatusModel.getStatusHistory).toHaveBeenCalledWith('test_user', 1000);
        });
        it('should return zero stats for user with no history', async () => {
            mockStatusModel.getStatusHistory.mockResolvedValue([]);
            const result = await statusService.getUserStats('test_user');
            expect(result).toEqual({
                totalEntries: 0,
                averageAltitude: 0,
                lastActivityDate: null
            });
        });
        it('should round average altitude to 2 decimal places', async () => {
            const mockHistory = [
                { ...mockStatusData, altitude: 1 },
                { ...mockStatusData, altitude: 2 },
                { ...mockStatusData, altitude: 3 }
            ];
            mockStatusModel.getStatusHistory.mockResolvedValue(mockHistory);
            const result = await statusService.getUserStats('test_user');
            expect(result.averageAltitude).toBe(2); // (1 + 2 + 3) / 3 = 2
        });
        it('should handle fractional averages correctly', async () => {
            const mockHistory = [
                { ...mockStatusData, altitude: 1 },
                { ...mockStatusData, altitude: 2 }
            ];
            mockStatusModel.getStatusHistory.mockResolvedValue(mockHistory);
            const result = await statusService.getUserStats('test_user');
            expect(result.averageAltitude).toBe(1.5); // (1 + 2) / 2 = 1.5
        });
        it('should throw DatabaseError when model throws', async () => {
            const originalError = new Error('Database error');
            mockStatusModel.getStatusHistory.mockRejectedValue(originalError);
            await expect(statusService.getUserStats('test_user'))
                .rejects.toThrow(AppError_1.DatabaseError);
        });
    });
});
//# sourceMappingURL=StatusService.test.js.map