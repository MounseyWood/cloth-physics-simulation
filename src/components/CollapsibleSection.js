import React, { useState } from 'react';
import './CollapsibleSection.css';

/**
 * CollapsibleSection component for progressive disclosure
 * 
 * @param {Object} props Component props
 * @param {string} props.title Section title
 * @param {React.ReactNode} props.children Child components to display when expanded
 * @param {boolean} [props.initiallyExpanded=false] Whether section starts expanded
 * @returns {JSX.Element} Collapsible section component
 */
const CollapsibleSection = ({ title, children, initiallyExpanded = false }) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  
  return (
    <div className={`collapsible-section ${expanded ? 'expanded' : ''}`}>
      {/* Header */}
      <div 
        className="collapsible-header"
        onClick={() => setExpanded(!expanded)}
      >
        <h3>{title}</h3>
        <div className="collapsible-toggle">
          <span>{expanded ? '−' : '+'}</span>
        </div>
      </div>
      
      {/* Content */}
      {expanded && (
        <div className="collapsible-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
