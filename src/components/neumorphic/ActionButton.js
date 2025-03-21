import React from 'react';
import './ActionButton.css';

/**
 * Neumorphic action button component
 * 
 * @param {Object} props Component props
 * @param {Function} props.onClick Click handler function
 * @param {boolean} [props.active=false] Whether button is in active state
 * @param {boolean} [props.primary=false] Whether button is primary (highlight color)
 * @param {React.ReactNode} props.children Button content
 * @returns {JSX.Element} Action button component
 */
const ActionButton = ({ onClick, active = false, primary = false, children }) => {
  return (
    <button 
      className={`neumorphic-button ${active ? 'active' : ''} ${primary ? 'primary' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default ActionButton;
