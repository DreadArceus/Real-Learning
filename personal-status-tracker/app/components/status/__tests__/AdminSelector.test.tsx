import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminSelector } from '../AdminSelector';
import { User } from '@/app/lib/api';

describe('AdminSelector', () => {
  const mockAdminUsers: User[] = [
    {
      id: 1,
      username: 'admin1',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      username: 'admin2',
      role: 'admin',
      createdAt: '2024-01-02T00:00:00Z',
      lastLogin: '2024-01-14T15:30:00Z'
    },
    {
      id: 3,
      username: 'admin3',
      role: 'admin',
      createdAt: '2024-01-03T00:00:00Z'
      // No lastLogin
    }
  ];

  const mockOnSelectUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with admin users available', () => {
    it('should render admin selector with all admins', () => {
      render(
        <AdminSelector
          adminUsers={mockAdminUsers}
          selectedUserId={null}
          onSelectUser={mockOnSelectUser}
        />
      );

      expect(screen.getByText('View Status for Admin:')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      
      // Check that all admin options are present
      expect(screen.getByText('admin1')).toBeInTheDocument();
      expect(screen.getByText('admin2')).toBeInTheDocument();
      expect(screen.getByText('admin3')).toBeInTheDocument();
    });

    it('should show last login information when available', () => {
      render(
        <AdminSelector
          adminUsers={mockAdminUsers}
          selectedUserId={null}
          onSelectUser={mockOnSelectUser}
        />
      );

      // Should show last active dates
      expect(screen.getByText(/Last active: 1\/15\/2024/)).toBeInTheDocument();
      expect(screen.getByText(/Last active: 1\/14\/2024/)).toBeInTheDocument();
      
      // admin3 should not have last active info since no lastLogin
      const admin3Text = screen.getByText('admin3').textContent;
      expect(admin3Text).not.toContain('Last active');
    });

    it('should call onSelectUser when an admin is selected', async () => {
      const user = userEvent.setup();
      
      render(
        <AdminSelector
          adminUsers={mockAdminUsers}
          selectedUserId={null}
          onSelectUser={mockOnSelectUser}
        />
      );

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '1');

      expect(mockOnSelectUser).toHaveBeenCalledWith('1');
    });

    it('should show selected admin information', () => {
      render(
        <AdminSelector
          adminUsers={mockAdminUsers}
          selectedUserId="2"
          onSelectUser={mockOnSelectUser}
        />
      );

      expect(screen.getByText('Viewing status data for: admin2')).toBeInTheDocument();
    });

    it('should be disabled when loading', () => {
      render(
        <AdminSelector
          adminUsers={mockAdminUsers}
          selectedUserId={null}
          onSelectUser={mockOnSelectUser}
          isLoading={true}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('should show default option when no selection made', () => {
      render(
        <AdminSelector
          adminUsers={mockAdminUsers}
          selectedUserId={null}
          onSelectUser={mockOnSelectUser}
        />
      );

      expect(screen.getByText('Select an admin to view their status...')).toBeInTheDocument();
    });

    it('should maintain selected value in dropdown', () => {
      render(
        <AdminSelector
          adminUsers={mockAdminUsers}
          selectedUserId="2"
          onSelectUser={mockOnSelectUser}
        />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('2');
    });
  });

  describe('with no admin users', () => {
    it('should show message when no admins are available', () => {
      render(
        <AdminSelector
          adminUsers={[]}
          selectedUserId={null}
          onSelectUser={mockOnSelectUser}
        />
      );

      expect(screen.getByText('No admin users found. Ask an admin to create an account to track their status.')).toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper labeling', () => {
      render(
        <AdminSelector
          adminUsers={mockAdminUsers}
          selectedUserId={null}
          onSelectUser={mockOnSelectUser}
        />
      );

      const select = screen.getByRole('combobox');
      const label = screen.getByText('View Status for Admin:');
      
      expect(select).toHaveAttribute('id', 'admin-select');
      expect(label).toHaveAttribute('for', 'admin-select');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      
      render(
        <AdminSelector
          adminUsers={mockAdminUsers}
          selectedUserId={null}
          onSelectUser={mockOnSelectUser}
        />
      );

      const select = screen.getByRole('combobox');
      
      // Should be focusable
      await user.tab();
      expect(select).toHaveFocus();
      
      // Should respond to keyboard selection
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      
      expect(mockOnSelectUser).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty selectedUserId string', () => {
      render(
        <AdminSelector
          adminUsers={mockAdminUsers}
          selectedUserId=""
          onSelectUser={mockOnSelectUser}
        />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('');
      expect(screen.queryByText(/Viewing status data for:/)).not.toBeInTheDocument();
    });

    it('should handle selectedUserId that does not match any admin', () => {
      render(
        <AdminSelector
          adminUsers={mockAdminUsers}
          selectedUserId="999"
          onSelectUser={mockOnSelectUser}
        />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('999');
      expect(screen.queryByText(/Viewing status data for:/)).not.toBeInTheDocument();
    });
  });
});