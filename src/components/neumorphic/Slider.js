import React, { useRef, useState, useEffect } from 'react';
import './Slider.css';

/**
 * Neumorphic slider component
 * 
 * @param {Object} props Component props
 * @param {number} props.min Minimum value
 * @param {number} props.max Maximum value
 * @param {number} props.step Step increment
 * @param {number} props.value Current value
 * @param {Function} props.onChange Change handler function
 * @returns {JSX.Element} Slider component
 */
const Slider = ({ min = 0, max = 1, step = 0.01, value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  
  // Calculate percentage for styling
  const percentage = ((value - min) / (max - min)) * 100;
  
  // Handle mouse/touch interactions
  const startDrag = (e) => {
    setIsDragging(true);
    updateValue(e);
    
    // Add event listeners for drag
    document.addEventListener('mousemove', updateValue);
    document.addEventListener('touchmove', updateValue, { passive: false });
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
  };
  
  const stopDrag = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', updateValue);
    document.removeEventListener('touchmove', updateValue);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);
  };
  
  const updateValue = (e) => {
    if (!sliderRef.current) return;
    
    // Prevent scrolling on touch devices
    if (e.type === 'touchmove') {
      e.preventDefault();
    }
    
    // Get slider dimensions
    const slider = sliderRef.current;
    const rect = slider.getBoundingClientRect();
    
    // Get horizontal position
    let clientX;
    if (e.type.startsWith('touch')) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    
    // Calculate position as percentage
    const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    
    // Convert to value in range, respecting step
    const rawValue = min + position * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    
    // Ensure value stays within bounds and respect precision
    const clampedValue = Math.max(min, Math.min(max, steppedValue));
    const preciseValue = parseFloat(clampedValue.toFixed(10));
    
    if (onChange && preciseValue !== value) {
      onChange(preciseValue);
    }
  };
  
  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', updateValue);
      document.removeEventListener('touchmove', updateValue);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
    };
  }, []);
  
  return (
    <div 
      className={`neumorphic-slider ${isDragging ? 'active' : ''}`}
      ref={sliderRef}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
    >
      <div className="slider-track">
        <div 
          className="slider-fill"
          style={{ width: `${percentage}%` }}
        ></div>
        <div 
          className="slider-handle"
          style={{ left: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Slider;
