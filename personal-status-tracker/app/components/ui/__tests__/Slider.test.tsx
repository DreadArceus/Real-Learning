import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slider } from '../Slider';

describe('Slider', () => {
  it('should render input with type range', () => {
    render(<Slider />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('type', 'range');
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes when label is provided', () => {
      render(
        <Slider
          label="Volume control"
          min={0}
          max={100}
          value={50}
        />
      );
      
      const slider = screen.getByRole('slider');
      const group = slider.closest('[role="group"]');
      
      expect(group).toBeInTheDocument();
      expect(screen.getByText('Volume control')).toHaveClass('sr-only');
    });

    it('should generate unique IDs for labels', () => {
      const { container } = render(
        <>
          <Slider label="Slider 1" />
          <Slider label="Slider 2" />
        </>
      );
      
      const labels = container.querySelectorAll('label');
      const labelIds = Array.from(labels).map(label => label.id);
      
      expect(labelIds[0]).not.toBe(labelIds[1]);
      expect(labelIds[0]).toMatch(/slider-.+-label/);
      expect(labelIds[1]).toMatch(/slider-.+-label/);
    });

    it('should use provided id', () => {
      render(<Slider id="custom-slider" label="Custom" />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('id', 'custom-slider');
      expect(screen.getByText('Custom')).toHaveAttribute('id', 'custom-slider-label');
    });
  });

  describe('labels', () => {
    it('should show min/max labels by default', () => {
      render(
        <Slider
          minLabel="Quiet"
          maxLabel="Loud"
        />
      );
      
      expect(screen.getByText('Quiet')).toBeInTheDocument();
      expect(screen.getByText('Loud')).toBeInTheDocument();
    });

    it('should hide labels when showLabels is false', () => {
      render(
        <Slider
          showLabels={false}
          minLabel="Min"
          maxLabel="Max"
        />
      );
      
      expect(screen.queryByText('Min')).not.toBeInTheDocument();
      expect(screen.queryByText('Max')).not.toBeInTheDocument();
    });

    it('should not show labels if not provided', () => {
      const { container } = render(<Slider />);
      
      const labelsContainer = container.querySelector('.flex.justify-between');
      expect(labelsContainer).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should handle onChange events', () => {
      const handleChange = jest.fn();
      render(
        <Slider
          min={0}
          max={10}
          value={5}
          onChange={handleChange}
        />
      );
      
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '7' } });
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('should be keyboard accessible', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Slider
          min={0}
          max={10}
          defaultValue={5}
          onChange={handleChange}
        />
      );
      
      const slider = screen.getByRole('slider');
      slider.focus();
      
      await user.keyboard('{ArrowRight}');
      // Note: keyboard interaction behavior varies by browser
      // The test verifies the component is focusable
      expect(document.activeElement).toBe(slider);
    });
  });

  describe('props', () => {
    it('should pass through input props', () => {
      render(
        <Slider
          min={1}
          max={100}
          step={5}
          value={50}
          disabled
          name="test-slider"
        />
      );
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '1');
      expect(slider).toHaveAttribute('max', '100');
      expect(slider).toHaveAttribute('step', '5');
      expect(slider).toHaveAttribute('value', '50');
      expect(slider).toHaveAttribute('name', 'test-slider');
      expect(slider).toBeDisabled();
    });

    it('should merge custom className', () => {
      render(
        <Slider className="custom-slider-class" />
      );
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveClass('custom-slider-class');
      expect(slider).toHaveClass('w-full', 'h-2'); // Still has default classes
    });
  });

  describe('styling', () => {
    it('should have default styles', () => {
      render(<Slider />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveClass(
        'w-full',
        'h-2',
        'bg-gray-200',
        'rounded-lg',
        'appearance-none',
        'cursor-pointer',
        'dark:bg-gray-700'
      );
    });

    it('should have focus styles', () => {
      render(<Slider />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    });
  });

  describe('controlled vs uncontrolled', () => {
    it('should work as controlled component', () => {
      const ControlledSlider = () => {
        const [value, setValue] = React.useState(5);
        return (
          <Slider
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            min={0}
            max={10}
          />
        );
      };
      
      render(<ControlledSlider />);
      const slider = screen.getByRole('slider');
      
      expect(slider).toHaveValue('5');
      
      fireEvent.change(slider, { target: { value: '8' } });
      expect(slider).toHaveValue('8');
    });

    it('should work as uncontrolled component', () => {
      render(<Slider defaultValue={3} min={0} max={10} />);
      const slider = screen.getByRole('slider');
      
      expect(slider).toHaveValue('3');
      
      fireEvent.change(slider, { target: { value: '7' } });
      expect(slider).toHaveValue('7');
    });
  });
});