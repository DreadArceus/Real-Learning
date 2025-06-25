import { Router } from 'express';
import { StatusService } from '../services/StatusService';
import { validateRequest } from '../middleware/validateRequest';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { 
  CreateStatusSchema, 
  UpdateStatusSchema, 
  UserIdSchema, 
  LimitSchema 
} from '../schemas/statusSchemas';
import { z } from 'zod';
import { logDataOperation } from '../middleware/logging';

const router = Router();
const statusService = new StatusService();

const GetStatusQuerySchema = z.object({
  userId: UserIdSchema.optional()
});

// GET /api/status - Get latest status (authenticated)
router.get('/', 
  authenticateToken,
  validateRequest(GetStatusQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const { userId } = req.query as any;
      
      // Admins can only view their own data or specify userId
      // Viewers can view any user's data by providing userId
      let targetUserId: string;
      if (req.user!.role === 'admin') {
        targetUserId = userId || req.user!.userId.toString();
      } else {
        // Viewers must specify which admin's data to view
        if (!userId) {
          return res.status(400).json({
            success: false,
            error: 'Viewers must specify userId parameter to view admin data',
            code: 'USER_ID_REQUIRED'
          });
        }
        targetUserId = userId;
      }
      
      const status = await statusService.getLatestStatus(targetUserId);

      // Log data read operation
      logDataOperation('read', 'status', req, {
        targetUserId,
        viewingOwnData: targetUserId === req.user!.userId.toString(),
        hasData: !!status
      });

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/status - Create new status entry (admin only)
router.post('/', 
  authenticateToken,
  requireAdmin,
  validateRequest(CreateStatusSchema, 'body'),
  async (req, res, next) => {
    try {
      // Admins can only create status for themselves
      const targetUserId = req.user!.userId.toString();
      const status = await statusService.createStatus(req.body, targetUserId);

      // Log status creation
      logDataOperation('create', 'status', req, {
        statusId: status.id,
        waterIntake: req.body.lastWaterIntake,
        altitude: req.body.altitude
      });

      res.status(201).json({
        success: true,
        data: status,
        message: 'Status created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/status - Update status (creates new entry) (admin only)
router.put('/', 
  authenticateToken,
  requireAdmin,
  validateRequest(UpdateStatusSchema, 'body'),
  async (req, res, next) => {
    try {
      // Admins can only update their own status
      const targetUserId = req.user!.userId.toString();
      const status = await statusService.updateStatus(req.body, targetUserId);

      // Log status update
      logDataOperation('update', 'status', req, {
        statusId: status.id,
        waterIntake: req.body.lastWaterIntake,
        altitude: req.body.altitude,
        fieldsUpdated: Object.keys(req.body)
      });

      res.json({
        success: true,
        data: status,
        message: 'Status updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

const GetHistoryQuerySchema = z.object({
  userId: UserIdSchema.optional(),
  limit: z.string().transform(Number).pipe(LimitSchema).optional().default('10')
});

// GET /api/status/history - Get status history (authenticated)
router.get('/history', 
  authenticateToken,
  validateRequest(GetHistoryQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const { userId, limit } = req.query as any;
      
      // Admins can view their own history or specify userId
      // Viewers can view any user's history by providing userId
      let targetUserId: string;
      if (req.user!.role === 'admin') {
        targetUserId = userId || req.user!.userId.toString();
      } else {
        // Viewers must specify which admin's history to view
        if (!userId) {
          return res.status(400).json({
            success: false,
            error: 'Viewers must specify userId parameter to view admin data',
            code: 'USER_ID_REQUIRED'
          });
        }
        targetUserId = userId;
      }
      
      const history = await statusService.getStatusHistory(targetUserId, limit);

      // Log history read operation
      logDataOperation('read', 'status_history', req, {
        targetUserId,
        limit,
        viewingOwnData: targetUserId === req.user!.userId.toString(),
        recordsReturned: history.length
      });

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/status - Delete all status entries for user (admin only)
router.delete('/', 
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      // Admins can only delete their own status
      const targetUserId = req.user!.userId.toString();
      await statusService.deleteAllStatus(targetUserId);

      // Log status deletion
      logDataOperation('delete', 'status_all', req, {
        targetUserId
      });

      res.json({
        success: true,
        message: 'All status entries deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/status/stats - Get user statistics (authenticated)
router.get('/stats',
  authenticateToken,
  validateRequest(GetStatusQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const { userId } = req.query as any;
      
      // Admins can view their own stats or specify userId
      // Viewers can view any user's stats by providing userId
      let targetUserId: string;
      if (req.user!.role === 'admin') {
        targetUserId = userId || req.user!.userId.toString();
      } else {
        // Viewers must specify which admin's stats to view
        targetUserId = userId;
      }
      
      const stats = await statusService.getUserStats(targetUserId);

      // Log stats read operation
      logDataOperation('read', 'status_stats', req, {
        targetUserId,
        viewingOwnData: targetUserId === req.user!.userId.toString(),
        totalEntries: stats.totalEntries
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;