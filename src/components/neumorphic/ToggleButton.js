import React from 'react';
import './ToggleButton.css';

/**
 * Neumorphic toggle button component
 * 
 * @param {Object} props Component props
 * @param {boolean} props.active Whether toggle is active
 * @param {Function} props.onChange Change handler function
 * @returns {JSX.Element} Toggle button component
 */
const ToggleButton = ({ active, onChange }) => {
  return (
    <div 
      className={`neumorphic-toggle ${active ? 'active' : ''}`}
      onClick={onChange}
    >
      <div className="toggle-handle"></div>
    </div>
  );
};

export default ToggleButton;
