import { Router } from 'express';
import { AuthService } from '../services/AuthService';
import { validateRequest } from '../middleware/validateRequest';
import { LoginSchema, CreateUserSchema } from '../schemas/authSchemas';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();
const authService = new AuthService();

// POST /api/auth/login - Login user
router.post('/login', 
  validateRequest(LoginSchema, 'body'),
  async (req, res, next) => {
    try {
      const authResponse = await authService.login(req.body);
      
      res.json({
        success: true,
        data: authResponse,
        message: 'Login successful'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/register - Register new viewer user (public)
router.post('/register',
  validateRequest(LoginSchema, 'body'), // Using LoginSchema since we only need username/password
  async (req, res, next) => {
    try {
      const { username, password } = req.body;
      // Force role to be 'viewer' for public registration
      const user = await authService.createUser(username, password, 'viewer');
      
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
      
      res.json({
        success: true,
        data: users
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
      
      await authService.deleteUser(userId);
      
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
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful. Please remove the token from client storage.'
  });
});

export default router;