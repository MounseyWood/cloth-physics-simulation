import React, { useEffect, useRef, useState } from 'react';
import { ClothSimulation } from './lib/clothEngine';
import { ClothRenderer } from './lib/renderer';
import './App.css';

// Components
import CollapsibleSection from './components/CollapsibleSection';
import Slider from './components/neumorphic/Slider';
import ToggleButton from './components/neumorphic/ToggleButton';
import SegmentedControl from './components/neumorphic/SegmentedControl';
import ActionButton from './components/neumorphic/ActionButton';
import WindControls from './components/WindControls';

function App() {
  // References
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const simulationRef = useRef(null);
  const rendererRef = useRef(null);
  
  // Simulation state
  const [isRunning, setIsRunning] = useState(true);
  const [simulationMode, setSimulationMode] = useState('plane');
  const [formMode, setFormMode] = useState('sphere');
  const [interactionMode, setInteractionMode] = useState('rotate');
  const [pinningMode, setPinningMode] = useState('top');
  const [shadingMode, setShadingMode] = useState('overlaid');
  
  // Parameter state
  const [damping, setDamping] = useState(0.98);
  const [dampingActive, setDampingActive] = useState(false);
  
  const [iterations, setIterations] = useState(5);
  const [iterationsActive, setIterationsActive] = useState(false);
  
  const [stretch, setStretch] = useState(1.0);
  const [stretchActive, setStretchActive] = useState(false);
  
  const [shear, setShear] = useState(1.0);
  const [shearActive, setShearActive] = useState(false);
  
  const [bending, setBending] = useState(1.0);
  const [bendingActive, setBendingActive] = useState(false);
  
  const [weight, setWeight] = useState(1.0);
  const [weightActive, setWeightActive] = useState(false);
  
  const [gravity, setGravity] = useState(0.4);
  const [gravityActive, setGravityActive] = useState(false);
  
  const [windX, setWindX] = useState(0.2);
  const [windXActive, setWindXActive] = useState(false);
  
  const [windY, setWindY] = useState(0);
  const [windYActive, setWindYActive] = useState(false);
  
  const [windZ, setWindZ] = useState(0.1);
  const [windZActive, setWindZActive] = useState(false);
  
  const [windBuffer, setWindBuffer] = useState(1.0);
  const [windBufferActive, setWindBufferActive] = useState(false);
  
  // Initialize simulation and renderer
  useEffect(() => {
    // Create simulation
    simulationRef.current = new ClothSimulation({
      damping,
      iterations,
      stretchFactor: stretch,
      shearFactor: shear,
      bendingFactor: bending,
      weight,
      windX,
      windY,
      windZ,
      windBuffer,
      gravity,
      simulationMode,
      formMode,
      pinningMode
    });
    
    // Create renderer
    rendererRef.current = new ClothRenderer(simulationRef.current);
    rendererRef.current.init(canvasRef.current);
    
    // Start animation loop
    animate();
    
    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);
  
  // Animation loop
  const animate = () => {
    if (isRunning && simulationRef.current) {
      simulationRef.current.update();
    }
    
    if (rendererRef.current) {
      rendererRef.current.render();
    }
    
    animationRef.current = requestAnimationFrame(animate);
  };
  
  // Handle simulation mode change
  useEffect(() => {
    if (simulationRef.current) {
      simulationRef.current.config.simulationMode = simulationMode;
      simulationRef.current.setupCloth();
      
      // If we're switching to draped mode, also update form
      if (simulationMode === 'draped' && rendererRef.current) {
        rendererRef.current.addDrapedForm();
      }
    }
  }, [simulationMode]);
  
  // Handle form mode change
  useEffect(() => {
    if (simulationRef.current && simulationMode === 'draped') {
      simulationRef.current.config.formMode = formMode;
      simulationRef.current.setupCloth();
      
      if (rendererRef.current) {
        rendererRef.current.addDrapedForm();
      }
    }
  }, [formMode, simulationMode]);
  
  // Handle pinning mode change
  useEffect(() => {
    if (simulationRef.current && simulationMode === 'plane') {
      simulationRef.current.config.pinningMode = pinningMode;
      simulationRef.current.setupCloth();
    }
  }, [pinningMode, simulationMode]);
  
  // Handle interaction mode change
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setInteractionMode(interactionMode);
    }
  }, [interactionMode]);
  
  // Handle shading mode change
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateShadingMode(shadingMode);
    }
  }, [shadingMode]);
  
  // Handle parameter changes
  useEffect(() => {
    if (simulationRef.current) {
      // Update parameters in simulation
      simulationRef.current.config.damping = damping;
      simulationRef.current.dampingActive = dampingActive;
      
      simulationRef.current.config.iterations = iterations;
      simulationRef.current.iterationsActive = iterationsActive;
      
      simulationRef.current.config.stretchFactor = stretch;
      simulationRef.current.stretchActive = stretchActive;
      
      simulationRef.current.config.shearFactor = shear;
      simulationRef.current.shearActive = shearActive;
      
      simulationRef.current.config.bendingFactor = bending;
      simulationRef.current.bendingActive = bendingActive;
      
      simulationRef.current.config.weight = weight;
      simulationRef.current.weightActive = weightActive;
      
      simulationRef.current.config.gravity = gravity;
      simulationRef.current.gravityActive = gravityActive;
      
      simulationRef.current.config.windX = windX;
      simulationRef.current.windXActive = windXActive;
      
      simulationRef.current.config.windY = windY;
      simulationRef.current.windYActive = windYActive;
      
      simulationRef.current.config.windZ = windZ;
      simulationRef.current.windZActive = windZActive;
      
      simulationRef.current.config.windBuffer = windBuffer;
      simulationRef.current.windBufActive = windBufferActive;
    }
  }, [
    damping, dampingActive,
    iterations, iterationsActive,
    stretch, stretchActive,
    shear, shearActive,
    bending, bendingActive,
    weight, weightActive,
    gravity, gravityActive,
    windX, windXActive,
    windY, windYActive,
    windZ, windZActive,
    windBuffer, windBufferActive
  ]);
  
  const handleResetCloth = () => {
    if (simulationRef.current) {
      simulationRef.current.setupCloth();
    }
  };
  
  const handleResetOrientation = () => {
    if (rendererRef.current) {
      rendererRef.current.resetCamera();
    }
  };
  
  const togglePlayPause = () => {
    setIsRunning(!isRunning);
  };
  
  return (
    <div className="app">
      {/* Main canvas */}
      <div className="canvas-container" ref={canvasRef}></div>
      
      {/* Control panel */}
      <div className="control-panel">
        <h1 className="app-title">Cloth Physics</h1>
        
        {/* Simulation Mode */}
        <div className="control-section">
          <h3>Simulation Mode</h3>
          <SegmentedControl
            options={[
              { value: 'plane', label: 'Plane' },
              { value: 'draped', label: 'Draped' }
            ]}
            value={simulationMode}
            onChange={(val) => setSimulationMode(val)}
          />
        </div>
        
        {/* Form Mode (only for Draped) */}
        {simulationMode === 'draped' && (
          <div className="control-section">
            <h3>Form Mode</h3>
            <SegmentedControl
              options={[
                { value: 'sphere', label: 'Sphere' },
                { value: 'cylinder', label: 'Cylinder' }
              ]}
              value={formMode}
              onChange={(val) => setFormMode(val)}
            />
          </div>
        )}
        
        {/* Pinning Mode (only for Plane) */}
        {simulationMode === 'plane' && (
          <div className="control-section">
            <h3>Pinning Mode</h3>
            <SegmentedControl
              options={[
                { value: 'top', label: 'Top Pinned' },
                { value: 'corners', label: 'Corner Pinned' }
              ]}
              value={pinningMode}
              onChange={(val) => setPinningMode(val)}
            />
          </div>
        )}
        
        {/* Interaction Mode */}
        <div className="control-section">
          <h3>Interaction Mode</h3>
          <SegmentedControl
            options={[
              { value: 'rotate', label: 'Rotate' },
              { value: 'drag', label: 'Drag' }
            ]}
            value={interactionMode}
            onChange={(val) => setInteractionMode(val)}
          />
        </div>
        
        {/* Collapsible Sections */}
        <CollapsibleSection title="Basic Parameters" initiallyExpanded={true}>
          {/* Damping */}
          <div className="parameter">
            <div className="parameter-header">
              <span>Damping: {damping.toFixed(2)}</span>
              <ToggleButton 
                active={dampingActive}
                onChange={() => setDampingActive(!dampingActive)}
              />
            </div>
            {dampingActive && (
              <Slider
                min={0.9}
                max={1.0}
                step={0.01}
                value={damping}
                onChange={(val) => setDamping(val)}
              />
            )}
          </div>
          
          {/* Gravity */}
          <div className="parameter">
            <div className="parameter-header">
              <span>Gravity: {gravity.toFixed(2)}</span>
              <ToggleButton 
                active={gravityActive}
                onChange={() => setGravityActive(!gravityActive)}
              />
            </div>
            {gravityActive && (
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={gravity}
                onChange={(val) => setGravity(val)}
              />
            )}
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Cloth Properties">
          {/* Stretch */}
          <div className="parameter">
            <div className="parameter-header">
              <span>Stretch: {stretch.toFixed(2)}</span>
              <ToggleButton 
                active={stretchActive}
                onChange={() => setStretchActive(!stretchActive)}
              />
            </div>
            {stretchActive && (
              <Slider
                min={0.8}
                max={1.2}
                step={0.01}
                value={stretch}
                onChange={(val) => setStretch(val)}
              />
            )}
          </div>
          
          {/* Shear */}
          <div className="parameter">
            <div className="parameter-header">
              <span>Shear: {shear.toFixed(2)}</span>
              <ToggleButton 
                active={shearActive}
                onChange={() => setShearActive(!shearActive)}
              />
            </div>
            {shearActive && (
              <Slider
                min={0.8}
                max={1.2}
                step={0.01}
                value={shear}
                onChange={(val) => setShear(val)}
              />
            )}
          </div>
          
          {/* Bending */}
          <div className="parameter">
            <div className="parameter-header">
              <span>Bending: {bending.toFixed(2)}</span>
              <ToggleButton 
                active={bendingActive}
                onChange={() => setBendingActive(!bendingActive)}
              />
            </div>
            {bendingActive && (
              <Slider
                min={0.8}
                max={1.2}
                step={0.01}
                value={bending}
                onChange={(val) => setBending(val)}
              />
            )}
          </div>
          
          {/* Weight */}
          <div className="parameter">
            <div className="parameter-header">
              <span>Weight: {weight.toFixed(2)}</span>
              <ToggleButton 
                active={weightActive}
                onChange={() => setWeightActive(!weightActive)}
              />
            </div>
            {weightActive && (
              <Slider
                min={0.5}
                max={2.0}
                step={0.1}
                value={weight}
                onChange={(val) => setWeight(val)}
              />
            )}
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Wind Controls">
          <WindControls
            windX={windX} setWindX={setWindX} windXActive={windXActive} setWindXActive={setWindXActive}
            windY={windY} setWindY={setWindY} windYActive={windYActive} setWindYActive={setWindYActive}
            windZ={windZ} setWindZ={setWindZ} windZActive={windZActive} setWindZActive={setWindZActive}
            windBuffer={windBuffer} setWindBuffer={setWindBuffer} windBufferActive={windBufferActive} setWindBufferActive={setWindBufferActive}
          />
        </CollapsibleSection>
        
        <CollapsibleSection title="Advanced">
          {/* Iterations */}
          <div className="parameter">
            <div className="parameter-header">
              <span>Iterations: {iterations}</span>
              <ToggleButton 
                active={iterationsActive}
                onChange={() => setIterationsActive(!iterationsActive)}
              />
            </div>
            {iterationsActive && (
              <Slider
                min={1}
                max={10}
                step={1}
                value={iterations}
                onChange={(val) => setIterations(val)}
              />
            )}
          </div>
          
          {/* Shading Mode */}
          <div className="parameter">
            <h3>Shading Mode</h3>
            <div className="shading-controls">
              <SegmentedControl
                options={[
                  { value: 'off', label: 'Off' },
                  { value: 'cloth', label: 'Cloth' },
                  { value: 'overlaid', label: 'Overlaid' },
                  { value: 'stress', label: 'Stress' },
                  { value: 'structure', label: 'Structure' }
                ]}
                value={shadingMode}
                onChange={(val) => setShadingMode(val)}
                fullWidth
              />
            </div>
          </div>
        </CollapsibleSection>
        
        {/* Action buttons */}
        <div className="action-buttons">
          <ActionButton onClick={handleResetCloth}>
            Reset Cloth
          </ActionButton>
          
          <ActionButton onClick={handleResetOrientation}>
            Reset View
          </ActionButton>
          
          <ActionButton 
            onClick={togglePlayPause}
            active={isRunning}
            primary
          >
            {isRunning ? 'Pause' : 'Play'}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

export default App;
