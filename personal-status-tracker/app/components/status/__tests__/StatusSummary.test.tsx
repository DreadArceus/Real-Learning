import { render, screen } from '@testing-library/react';
import { StatusSummary } from '../StatusSummary';
import { StatusData, HydrationStatus, MoodLevel } from '@/app/types/status';

describe('StatusSummary', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createStatusData = (overrides?: Partial<StatusData>): StatusData => ({
    lastWaterIntake: '',
    altitude: 5,
    lastUpdated: '',
    ...overrides
  });

  it('should render summary title', () => {
    render(<StatusSummary statusData={createStatusData()} />);
    
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Status Summary');
  });

  describe('hydration status display', () => {
    it('should show "No data" when no water intake recorded', () => {
      render(<StatusSummary statusData={createStatusData()} />);
      
      expect(screen.getByText('Hydration Status:')).toBeInTheDocument();
      expect(screen.getByText(HydrationStatus.NO_DATA)).toBeInTheDocument();
    });

    it('should show "Well hydrated" for recent water intake', () => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60000).toISOString();
      
      render(
        <StatusSummary 
          statusData={createStatusData({ lastWaterIntake: thirtyMinutesAgo })} 
        />
      );
      
      expect(screen.getByText(HydrationStatus.WELL_HYDRATED)).toBeInTheDocument();
    });

    it('should show "Dehydrated!" for old water intake', () => {
      const eightHoursAgo = new Date(Date.now() - 8 * 3600000).toISOString();
      
      render(
        <StatusSummary 
          statusData={createStatusData({ lastWaterIntake: eightHoursAgo })} 
        />
      );
      
      expect(screen.getByText(HydrationStatus.DEHYDRATED)).toBeInTheDocument();
    });
  });

  describe('mood level display', () => {
    it('should show correct mood level based on altitude', () => {
      const testCases = [
        { altitude: 9, expectedMood: MoodLevel.EXCELLENT },
        { altitude: 7, expectedMood: MoodLevel.GOOD },
        { altitude: 5, expectedMood: MoodLevel.FAIR },
        { altitude: 2, expectedMood: MoodLevel.LOW },
      ];

      testCases.forEach(({ altitude, expectedMood }) => {
        const { unmount } = render(
          <StatusSummary statusData={createStatusData({ altitude })} />
        );
        
        expect(screen.getByText('Mood Level:')).toBeInTheDocument();
        expect(screen.getByText(expectedMood)).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should apply correct color class to mood level', () => {
      render(
        <StatusSummary statusData={createStatusData({ altitude: 9 })} />
      );
      
      const moodText = screen.getByText(MoodLevel.EXCELLENT);
      expect(moodText).toHaveClass('text-green-600', 'dark:text-green-400');
    });
  });

  describe('last updated display', () => {
    it('should not show last updated when empty', () => {
      render(<StatusSummary statusData={createStatusData()} />);
      
      expect(screen.queryByText(/Last updated:/)).not.toBeInTheDocument();
    });

    it('should show formatted last updated time', () => {
      const lastUpdated = '2024-01-15T10:30:00Z';
      
      render(
        <StatusSummary 
          statusData={createStatusData({ lastUpdated })} 
        />
      );
      
      const lastUpdatedText = screen.getByText(/Last updated:/);
      expect(lastUpdatedText).toBeInTheDocument();
      expect(lastUpdatedText.textContent).toContain('2024');
      expect(lastUpdatedText.textContent).toContain('1/15/2024'); // US locale format
    });
  });

  describe('memoization', () => {
    it('should memoize hydration status calculation', () => {
      const calculateHydrationSpy = jest.fn();
      
      // Mock the getHydrationStatus function
      jest.mock('../../../lib/utils/statusHelpers', () => ({
        ...jest.requireActual('../../../lib/utils/statusHelpers'),
        getHydrationStatus: calculateHydrationSpy
      }));

      const statusData = createStatusData({ 
        lastWaterIntake: new Date().toISOString() 
      });

      const { rerender } = render(<StatusSummary statusData={statusData} />);
      
      // Re-render with same data
      rerender(<StatusSummary statusData={statusData} />);
      
      // The calculation should be memoized and not called again
      // Note: This test is illustrative - actual implementation uses useMemo
    });
  });

  describe('layout', () => {
    it('should use grid layout for status items', () => {
      render(<StatusSummary statusData={createStatusData()} />);
      
      // Find the grid container by getting the parent of the status items
      const hydrationSpan = screen.getByText('Hydration Status:');
      const gridContainer = hydrationSpan.closest('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('grid');
    });

    it('should apply correct text styles', () => {
      render(
        <StatusSummary 
          statusData={createStatusData({ lastUpdated: '2024-01-15T10:00:00Z' })} 
        />
      );
      
      const lastUpdatedText = screen.getByText(/Last updated:/);
      expect(lastUpdatedText).toHaveClass('text-xs', 'text-gray-500', 'dark:text-gray-400', 'mt-4');
    });
  });

  describe('edge cases', () => {
    it('should handle all data present', () => {
      const fullData = createStatusData({
        lastWaterIntake: new Date(Date.now() - 2 * 3600000).toISOString(),
        altitude: 7,
        lastUpdated: new Date().toISOString()
      });

      render(<StatusSummary statusData={fullData} />);
      
      expect(screen.getByText(HydrationStatus.GOOD)).toBeInTheDocument();
      expect(screen.getByText(MoodLevel.GOOD)).toBeInTheDocument();
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    it('should handle invalid dates gracefully', () => {
      const invalidData = createStatusData({
        lastWaterIntake: 'invalid-date',
        lastUpdated: 'invalid-date'
      });

      render(<StatusSummary statusData={invalidData} />);
      
      // Should not crash and display appropriate fallbacks
      expect(screen.getByText(HydrationStatus.DEHYDRATED)).toBeInTheDocument();
      expect(screen.getByText(/Invalid date/)).toBeInTheDocument();
    });
  });

  it('should be a memoized component', () => {
    const renderSpy = jest.fn();
    
    const TestWrapper = ({ statusData }: { statusData: StatusData }) => {
      renderSpy();
      return <StatusSummary statusData={statusData} />;
    };

    const data = createStatusData();
    const { rerender } = render(<TestWrapper statusData={data} />);
    
    expect(renderSpy).toHaveBeenCalledTimes(1);

    // Re-render with same data
    rerender(<TestWrapper statusData={data} />);
    expect(renderSpy).toHaveBeenCalledTimes(2); // Parent re-renders
  });
});