import React from 'react';
import Slider from './neumorphic/Slider';
import ToggleButton from './neumorphic/ToggleButton';

/**
 * Wind controls component for adjusting wind parameters
 * 
 * @param {Object} props Component props
 * @returns {JSX.Element} Wind controls component
 */
const WindControls = ({
  windX, setWindX, windXActive, setWindXActive,
  windY, setWindY, windYActive, setWindYActive,
  windZ, setWindZ, windZActive, setWindZActive,
  windBuffer, setWindBuffer, windBufferActive, setWindBufferActive
}) => {
  return (
    <>
      {/* Wind X */}
      <div className="parameter">
        <div className="parameter-header">
          <span>Wind X: {windX.toFixed(2)}</span>
          <ToggleButton 
            active={windXActive}
            onChange={() => setWindXActive(!windXActive)}
          />
        </div>
        {windXActive && (
          <Slider
            min={-1}
            max={1}
            step={0.05}
            value={windX}
            onChange={(val) => setWindX(val)}
          />
        )}
      </div>
      
      {/* Wind Y */}
      <div className="parameter">
        <div className="parameter-header">
          <span>Wind Y: {windY.toFixed(2)}</span>
          <ToggleButton 
            active={windYActive}
            onChange={() => setWindYActive(!windYActive)}
          />
        </div>
        {windYActive && (
          <Slider
            min={-1}
            max={1}
            step={0.05}
            value={windY}
            onChange={(val) => setWindY(val)}
          />
        )}
      </div>
      
      {/* Wind Z */}
      <div className="parameter">
        <div className="parameter-header">
          <span>Wind Z: {windZ.toFixed(2)}</span>
          <ToggleButton 
            active={windZActive}
            onChange={() => setWindZActive(!windZActive)}
          />
        </div>
        {windZActive && (
          <Slider
            min={-1}
            max={1}
            step={0.05}
            value={windZ}
            onChange={(val) => setWindZ(val)}
          />
        )}
      </div>
      
      {/* Wind Buffer (variation/intensity) */}
      <div className="parameter">
        <div className="parameter-header">
          <span>Wind Intensity: {windBuffer.toFixed(2)}</span>
          <ToggleButton 
            active={windBufferActive}
            onChange={() => setWindBufferActive(!windBufferActive)}
          />
        </div>
        {windBufferActive && (
          <Slider
            min={0.1}
            max={3}
            step={0.1}
            value={windBuffer}
            onChange={(val) => setWindBuffer(val)}
          />
        )}
      </div>
    </>
  );
};

export default WindControls;
