import React from 'react';
import { render, screen } from '@testing-library/react';
import { RoleBasedComponent, AdminOnlyComponent, ViewerOnlyComponent } from '../RoleBasedComponent';
import { mockAdminUser, mockViewerUser } from '../../../__tests__/auth-test-utils';

// Mock the auth context
const mockUseAuth = jest.fn();

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

describe('RoleBasedComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with admin user', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser,
        isAdmin: true,
        isAuthenticated: true,
        token: 'mock-token',
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        error: null
      });
    });

    it('renders children for admin when no role restrictions', () => {
      render(
        <RoleBasedComponent>
          <div>Admin content</div>
        </RoleBasedComponent>
      );

      expect(screen.getByText('Admin content')).toBeInTheDocument();
    });

    it('renders children for admin when adminOnly is true', () => {
      render(
        <RoleBasedComponent adminOnly>
          <div>Admin only content</div>
        </RoleBasedComponent>
      );

      expect(screen.getByText('Admin only content')).toBeInTheDocument();
    });

    it('renders children for admin when required role is admin', () => {
      render(
        <RoleBasedComponent requiredRole="admin">
          <div>Admin role content</div>
        </RoleBasedComponent>
      );

      expect(screen.getByText('Admin role content')).toBeInTheDocument();
    });

    it('renders fallback when required role is viewer', () => {
      render(
        <RoleBasedComponent requiredRole="viewer" fallback={<div>Access denied</div>}>
          <div>Viewer only content</div>
        </RoleBasedComponent>
      );

      expect(screen.getByText('Access denied')).toBeInTheDocument();
      expect(screen.queryByText('Viewer only content')).not.toBeInTheDocument();
    });
  });

  describe('with viewer user', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockViewerUser,
        isAdmin: false,
        isAuthenticated: true,
        token: 'mock-token',
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        error: null
      });
    });

    it('renders children for viewer when no role restrictions', () => {
      render(
        <RoleBasedComponent>
          <div>General content</div>
        </RoleBasedComponent>
      );

      expect(screen.getByText('General content')).toBeInTheDocument();
    });

    it('renders fallback for viewer when adminOnly is true', () => {
      render(
        <RoleBasedComponent adminOnly fallback={<div>Not admin</div>}>
          <div>Admin only content</div>
        </RoleBasedComponent>
      );

      expect(screen.getByText('Not admin')).toBeInTheDocument();
      expect(screen.queryByText('Admin only content')).not.toBeInTheDocument();
    });

    it('renders children for viewer when required role is viewer', () => {
      render(
        <RoleBasedComponent requiredRole="viewer">
          <div>Viewer content</div>
        </RoleBasedComponent>
      );

      expect(screen.getByText('Viewer content')).toBeInTheDocument();
    });

    it('renders fallback when required role is admin', () => {
      render(
        <RoleBasedComponent requiredRole="admin" fallback={<div>Need admin</div>}>
          <div>Admin content</div>
        </RoleBasedComponent>
      );

      expect(screen.getByText('Need admin')).toBeInTheDocument();
      expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
    });
  });

  describe('with no user', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAdmin: false,
        isAuthenticated: false,
        token: null,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        error: null
      });
    });

    it('renders children when no role restrictions', () => {
      render(
        <RoleBasedComponent>
          <div>Public content</div>
        </RoleBasedComponent>
      );

      expect(screen.getByText('Public content')).toBeInTheDocument();
    });

    it('renders fallback when adminOnly is true', () => {
      render(
        <RoleBasedComponent adminOnly fallback={<div>Login required</div>}>
          <div>Admin content</div>
        </RoleBasedComponent>
      );

      expect(screen.getByText('Login required')).toBeInTheDocument();
      expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
    });

    it('renders fallback when role is required', () => {
      render(
        <RoleBasedComponent requiredRole="viewer" fallback={<div>Login required</div>}>
          <div>Viewer content</div>
        </RoleBasedComponent>
      );

      expect(screen.getByText('Login required')).toBeInTheDocument();
      expect(screen.queryByText('Viewer content')).not.toBeInTheDocument();
    });
  });

  describe('fallback behavior', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockViewerUser,
        isAdmin: false,
        isAuthenticated: true,
        token: 'mock-token',
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        error: null
      });
    });

    it('renders null when no fallback provided', () => {
      const { container } = render(
        <RoleBasedComponent adminOnly>
          <div>Admin content</div>
        </RoleBasedComponent>
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders custom fallback component', () => {
      render(
        <RoleBasedComponent adminOnly fallback={<div data-testid="custom-fallback">Custom fallback</div>}>
          <div>Admin content</div>
        </RoleBasedComponent>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    });
  });
});

describe('AdminOnlyComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders for admin user', () => {
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAdmin: true,
      isAuthenticated: true,
      token: 'mock-token',
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      error: null
    });

    render(
      <AdminOnlyComponent>
        <div>Admin only content</div>
      </AdminOnlyComponent>
    );

    expect(screen.getByText('Admin only content')).toBeInTheDocument();
  });

  it('renders fallback for non-admin user', () => {
    mockUseAuth.mockReturnValue({
      user: mockViewerUser,
      isAdmin: false,
      isAuthenticated: true,
      token: 'mock-token',
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      error: null
    });

    render(
      <AdminOnlyComponent fallback={<div>Not admin</div>}>
        <div>Admin only content</div>
      </AdminOnlyComponent>
    );

    expect(screen.getByText('Not admin')).toBeInTheDocument();
    expect(screen.queryByText('Admin only content')).not.toBeInTheDocument();
  });
});

describe('ViewerOnlyComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders for viewer user', () => {
    mockUseAuth.mockReturnValue({
      user: mockViewerUser,
      isAdmin: false,
      isAuthenticated: true,
      token: 'mock-token',
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      error: null
    });

    render(
      <ViewerOnlyComponent>
        <div>Viewer only content</div>
      </ViewerOnlyComponent>
    );

    expect(screen.getByText('Viewer only content')).toBeInTheDocument();
  });

  it('renders fallback for admin user', () => {
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAdmin: true,
      isAuthenticated: true,
      token: 'mock-token',
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      error: null
    });

    render(
      <ViewerOnlyComponent fallback={<div>Not viewer</div>}>
        <div>Viewer only content</div>
      </ViewerOnlyComponent>
    );

    expect(screen.getByText('Not viewer')).toBeInTheDocument();
    expect(screen.queryByText('Viewer only content')).not.toBeInTheDocument();
  });
});