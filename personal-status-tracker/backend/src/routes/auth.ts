import { Router } from 'express';
import { AuthService } from '../services/AuthService';
import { validateRequest } from '../middleware/validateRequest';
import { LoginSchema, RegisterSchema, CreateUserSchema } from '../schemas/authSchemas';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { logAuthEvent, logSecurityEvent, logDataOperation } from '../middleware/logging';

const router = Router();
const authService = new AuthService();

// POST /api/auth/login - Login user
router.post('/login', 
  validateRequest(LoginSchema, 'body'),
  async (req, res, next) => {
    try {
      const { username } = req.body;
      const authResponse = await authService.login(req.body);
      
      // Log successful login
      logAuthEvent('login_success', username, req, { 
        userId: authResponse.user.id,
        role: authResponse.user.role 
      });
      
      res.json({
        success: true,
        data: authResponse,
        message: 'Login successful'
      });
    } catch (error) {
      // Log failed login attempt
      const { username } = req.body;
      logAuthEvent('login_failure', username || 'unknown', req, { 
        reason: error instanceof Error ? error.message : 'Unknown error'
      });
      next(error);
    }
  }
);

// POST /api/auth/register - Register new viewer user (public)
router.post('/register',
  validateRequest(RegisterSchema, 'body'),
  async (req, res, next) => {
    try {
      const { username, password, privacyPolicyAccepted } = req.body;
      // Force role to be 'viewer' for public registration
      const user = await authService.createUser(username, password, 'viewer', privacyPolicyAccepted);
      
      // Log successful registration
      logAuthEvent('registration', username, req, { 
        userId: user.id,
        role: 'viewer',
        registrationType: 'public',
        privacyPolicyAccepted
      });
      
      res.status(201).json({
        success: true,
        data: user,
        message: 'Account created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/admin/register - Register new user with any role (admin only)
router.post('/admin/register',
  authenticateToken,
  requireAdmin,
  validateRequest(CreateUserSchema, 'body'),
  async (req, res, next) => {
    try {
      const { username, password, role } = req.body;
      const user = await authService.createUser(username, password, role);
      
      // Log admin user creation
      logAuthEvent('registration', username, req, { 
        userId: user.id,
        role: role,
        registrationType: 'admin_created',
        createdBy: req.user!.username,
        createdByUserId: req.user!.userId
      });
      
      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/me - Get current user info
router.get('/me',
  authenticateToken,
  async (req, res, next) => {
    try {
      const user = await authService.getUserById(req.user!.userId);
      
      // Log profile access
      logDataOperation('read', 'user_profile', req, {
        profileUserId: req.user!.userId
      });
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/users - Get all users (admin only)
router.get('/users',
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const users = await authService.getAllUsers();
      
      // Log admin viewing all users
      logDataOperation('read', 'all_users', req, {
        userCount: users.length
      });
      
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/admins - Get all admin users (for viewers to select from)
router.get('/admins',
  authenticateToken,
  async (req, res, next) => {
    try {
      const admins = await authService.getAdminUsers();
      
      // Log admin list access (for viewers to select admin to view)
      logDataOperation('read', 'admin_users', req, {
        adminCount: admins.length,
        userRole: req.user!.role
      });
      
      res.json({
        success: true,
        data: admins
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/auth/users/:id - Delete user (admin only)
router.delete('/users/:id',
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (userId === req.user!.userId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete your own account',
          code: 'INVALID_OPERATION'
        });
      }
      
      // Get user info before deletion for logging
      const userToDelete = await authService.getUserById(userId);
      
      await authService.deleteUser(userId);
      
      // Log user deletion
      logSecurityEvent('user_deleted', {
        deletedUserId: userId,
        deletedUsername: userToDelete?.username,
        deletedUserRole: userToDelete?.role,
        deletedBy: req.user!.username,
        deletedByUserId: req.user!.userId
      }, req);
      
      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  // Log logout event
  logAuthEvent('logout', req.user!.username, req, {
    userId: req.user!.userId,
    role: req.user!.role
  });
  
  res.json({
    success: true,
    message: 'Logout successful. Please remove the token from client storage.'
  });
});

export default router;