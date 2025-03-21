import React from 'react';
import './SegmentedControl.css';

/**
 * Neumorphic segmented control component
 * 
 * @param {Object} props Component props
 * @param {Array} props.options Array of {value, label} objects
 * @param {string} props.value Current selected value
 * @param {Function} props.onChange Change handler function
 * @param {boolean} [props.fullWidth=false] Whether to use full width layout
 * @returns {JSX.Element} Segmented control component
 */
const SegmentedControl = ({ options, value, onChange, fullWidth = false }) => {
  return (
    <div className={`segmented-control ${fullWidth ? 'full-width' : ''}`}>
      {options.map((option) => (
        <div 
          key={option.value}
          className={`segment ${value === option.value ? 'active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
};

export default SegmentedControl;
