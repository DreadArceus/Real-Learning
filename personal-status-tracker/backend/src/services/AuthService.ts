import { UserModel } from '../models/UserModel';
import { LoginInput } from '../schemas/authSchemas';
import { AuthResponse, User } from '../types';
import { generateToken } from '../utils/jwt';
import { ValidationError, NotFoundError } from '../errors/AppError';

export class AuthService {
  private userModel: UserModel;

  constructor() {
    this.userModel = new UserModel();
  }

  async login(credentials: LoginInput): Promise<AuthResponse> {
    const { username, password } = credentials;

    // Find user by username
    const user = await this.userModel.findByUsername(username);
    if (!user) {
      throw new ValidationError('Invalid username or password');
    }

    // Validate password
    const isValidPassword = await this.userModel.validatePassword(password, user.password);
    if (!isValidPassword) {
      throw new ValidationError('Invalid username or password');
    }

    // Update last login
    await this.userModel.updateLastLogin(user.id!);

    // Generate JWT token
    const token = generateToken({
      userId: user.id!,
      username: user.username,
      role: user.role
    });

    // Return response without password
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      token,
      user: userWithoutPassword
    };
  }

  async createUser(username: string, password: string, role: 'admin' | 'viewer' = 'viewer'): Promise<Omit<User, 'password'>> {
    try {
      // Check if user already exists
      const existingUser = await this.userModel.findByUsername(username);
      if (existingUser) {
        throw new ValidationError('Username already exists');
      }

      // Create new user
      const user = await this.userModel.createUser(username, password, role);
      const { password: _, ...userWithoutPassword } = user;
      
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error('Failed to create user');
    }
  }

  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    return this.userModel.getAllUsers();
  }

  async deleteUser(id: number): Promise<void> {
    const deleted = await this.userModel.deleteUser(id);
    if (!deleted) {
      throw new NotFoundError('User not found');
    }
  }

  async getUserById(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}