import { StatusModel } from '../models/StatusModel';
import { CreateStatusInput, UpdateStatusInput } from '../schemas/statusSchemas';
import { StatusData } from '../types';
import { NotFoundError, DatabaseError } from '../errors/AppError';

export class StatusService {
  private statusModel: StatusModel;

  constructor() {
    this.statusModel = new StatusModel();
  }

  async getLatestStatus(userId: string): Promise<StatusData | null> {
    try {
      return await this.statusModel.getLatestStatus(userId);
    } catch (error) {
      throw new DatabaseError(
        'Failed to retrieve latest status',
        error instanceof Error ? error : undefined
      );
    }
  }

  async createStatus(data: CreateStatusInput, userId: string): Promise<StatusData> {
    try {
      const statusData: Omit<StatusData, 'id' | 'createdAt'> = {
        ...data,
        lastUpdated: new Date().toISOString(),
        userId
      };

      return await this.statusModel.createStatus(statusData, userId);
    } catch (error) {
      throw new DatabaseError(
        'Failed to create status',
        error instanceof Error ? error : undefined
      );
    }
  }

  async updateStatus(data: UpdateStatusInput, userId: string): Promise<StatusData> {
    try {
      // First check if user has any existing status
      const existingStatus = await this.statusModel.getLatestStatus(userId);
      if (!existingStatus) {
        throw new NotFoundError('No existing status found for user. Create a status first.');
      }

      const statusData: Partial<StatusData> = {
        ...data,
        lastUpdated: new Date().toISOString()
      };

      const updatedStatus = await this.statusModel.updateStatus(statusData, userId);
      if (!updatedStatus) {
        throw new DatabaseError('Failed to update status - no data returned');
      }
      return updatedStatus;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        'Failed to update status',
        error instanceof Error ? error : undefined
      );
    }
  }

  async getStatusHistory(userId: string, limit: number): Promise<StatusData[]> {
    try {
      return await this.statusModel.getStatusHistory(userId, limit);
    } catch (error) {
      throw new DatabaseError(
        'Failed to retrieve status history',
        error instanceof Error ? error : undefined
      );
    }
  }

  async deleteAllStatus(userId: string): Promise<boolean> {
    try {
      const result = await this.statusModel.deleteAllStatus(userId);
      if (!result) {
        throw new NotFoundError('No status entries found for user');
      }
      return result;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        'Failed to delete status entries',
        error instanceof Error ? error : undefined
      );
    }
  }

  async getUserStats(userId: string): Promise<{
    totalEntries: number;
    averageAltitude: number;
    lastActivityDate: string | null;
  }> {
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
    } catch (error) {
      throw new DatabaseError(
        'Failed to retrieve user statistics',
        error instanceof Error ? error : undefined
      );
    }
  }
}