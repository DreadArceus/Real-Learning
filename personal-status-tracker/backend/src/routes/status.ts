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

const router = Router();
const statusService = new StatusService();

const GetStatusQuerySchema = z.object({
  userId: UserIdSchema.optional().default('default_user')
});

// GET /api/status - Get latest status (authenticated)
router.get('/', 
  authenticateToken,
  validateRequest(GetStatusQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const { userId } = req.query as any;
      
      // Non-admin users can only access default user data
      const targetUserId = req.user!.role === 'admin' ? userId : 'default_user';
      const status = await statusService.getLatestStatus(targetUserId);

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
  validateRequest(GetStatusQuerySchema, 'query'),
  validateRequest(CreateStatusSchema, 'body'),
  async (req, res, next) => {
    try {
      const { userId } = req.query as any;
      const status = await statusService.createStatus(req.body, userId);

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
  validateRequest(GetStatusQuerySchema, 'query'),
  validateRequest(UpdateStatusSchema, 'body'),
  async (req, res, next) => {
    try {
      const { userId } = req.query as any;
      const status = await statusService.updateStatus(req.body, userId);

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
  userId: UserIdSchema.optional().default('default_user'),
  limit: z.string().transform(Number).pipe(LimitSchema).optional().default('10')
});

// GET /api/status/history - Get status history (authenticated)
router.get('/history', 
  authenticateToken,
  validateRequest(GetHistoryQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const { userId, limit } = req.query as any;
      
      // Non-admin users can only access default user data
      const targetUserId = req.user!.role === 'admin' ? userId : 'default_user';
      const history = await statusService.getStatusHistory(targetUserId, limit);

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
  validateRequest(GetStatusQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const { userId } = req.query as any;
      await statusService.deleteAllStatus(userId);

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
      
      // Non-admin users can only access default user data
      const targetUserId = req.user!.role === 'admin' ? userId : 'default_user';
      const stats = await statusService.getUserStats(targetUserId);

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