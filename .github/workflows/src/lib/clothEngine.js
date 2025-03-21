/**
 * Core physics engine for cloth simulation
 * Adapted from the original P5.js implementation
 */

// Constants for constraint types
export const CONSTRAINT_TYPES = {
  STRUCTURAL: 'structural',
  SHEAR: 'shear',
  BENDING: 'bending'
};

export class ClothSimulation {
  constructor(options = {}) {
    // Default configuration
    this.config = {
      cols: 20,
      rows: 20, 
      spacing: 20,
      damping: 0.98,
      iterations: 5,
      stretchFactor: 1.0,
      shearFactor: 1.0,
      bendingFactor: 1.0,
      weight: 1.0,
      windX: 0.2,
      windY: 0,
      windZ: 0.1,
      windBuffer: 1.0,
      gravity: 0.4,
      simulationMode: 'plane', // 'plane' or 'draped'
      formMode: 'sphere', // 'sphere' or 'cylinder'
      pinningMode: 'top', // 'top' or 'corners'
      ...options
    };
    
    // SIMULATION PARAMETERS (default)
    this.dampingActive = false;
    this.iterationsActive = false;
    this.stretchActive = false;
    this.shearActive = false;
    this.bendingActive = false;
    this.weightActive = false;
    this.windXActive = false;
    this.windYActive = false;
    this.windZActive = false;
    this.windBufActive = false;
    this.gravityActive = false;
    
    // BASELINE (Off) values
    this.BASE_DAMPING = 1.0;
    this.BASE_ITERATIONS = 1;
    this.BASE_STRETCH = 1.0;
    this.BASE_SHEAR = 1.0;
    this.BASE_BENDING = 1.0;
    this.BASE_WEIGHT = 1.0;
    this.BASE_WINDX = 0.0;
    this.BASE_WINDY = 0.0;
    this.BASE_WINDZ = 0.0;
    this.BASE_WINDBUFFER = 1.0;
    this.BASE_GRAVITY = 0.0;

    // Initialize simulation data structures
    this.clothPoints = [];
    this.clothConstraints = [];
    this.grid = [];
    this.horizontal = [];
    this.vertical = [];
    this.centers = [];
    this.cellRestArea = [];
    
    // Sphere parameters
    this.sphereCentre = { x: 0, y: 0, z: 0 };
    this.sphereRadius = 100;
    
    // Cylinder parameters
    this.cylRadius = 100;
    this.cylHeight = 300;
    this.cylinderTopY = -50;
    this.cylinderBottomY = this.cylinderTopY + this.cylHeight;
    
    // Floor
    this.floorY = 150;
    
    // Frame counter for animations
    this.frameCount = 0;
    
    // Set up the cloth
    this.setupCloth();
  }
  
  setupCloth() {
    this.clothPoints = [];
    this.clothConstraints = [];
    this.grid = [];
    this.horizontal = [];
    this.vertical = [];
    this.centers = [];
    this.cellRestArea = [];
    
    const { cols, rows, spacing } = this.config;
    const clothWidth = (cols - 1) * spacing;
    const clothHeight = (rows - 1) * spacing;
    
    if (this.config.simulationMode === 'plane') {
      const startX = -clothWidth/2 + 40; // Slight offset for viewing
      const startY = -clothHeight/2;
      this.createClothPoints_Plane(startX, startY, 0);
    } else {
      // Draped mode
      if (this.config.formMode === 'sphere') {
        this.sphereCentre = { x: 0, y: 0, z: 0 };
        this.sphereRadius = 100;
        const startY = -this.sphereRadius;
        this.createClothPoints_Draped(-clothWidth/2, startY, -clothHeight/2);
        
        // Pin centre cloth point to top of sphere
        const midRow = Math.floor(rows/2);
        const midCol = Math.floor(cols/2);
        const centerIdx = this.grid[midRow][midCol];
        this.clothPoints[centerIdx].pinned = true;
        this.clothPoints[centerIdx].x = this.sphereCentre.x;
        this.clothPoints[centerIdx].y = this.sphereCentre.y - this.sphereRadius;
        this.clothPoints[centerIdx].z = this.sphereCentre.z;
        this.clothPoints[centerIdx].oldx = this.sphereCentre.x;
        this.clothPoints[centerIdx].oldy = this.sphereCentre.y - this.sphereRadius;
        this.clothPoints[centerIdx].oldz = this.sphereCentre.z;
      } else if (this.config.formMode === 'cylinder') {
        const startY = this.cylinderTopY;
        this.createClothPoints_Draped(-clothWidth/2, startY, -clothHeight/2);
        
        // Pin centre cloth point at cylinder's top centre
        const midRow = Math.floor(rows/2);
        const midCol = Math.floor(cols/2);
        const centerIdx = this.grid[midRow][midCol];
        this.clothPoints[centerIdx].pinned = true;
        this.clothPoints[centerIdx].x = 0;
        this.clothPoints[centerIdx].y = this.cylinderTopY;
        this.clothPoints[centerIdx].z = 0;
        this.clothPoints[centerIdx].oldx = 0;
        this.clothPoints[centerIdx].oldy = this.cylinderTopY;
        this.clothPoints[centerIdx].oldz = 0;
      }
    }
    
    // Override floor if needed
    if (this.config.simulationMode === 'draped') {
      if (this.config.formMode === 'sphere') {
        this.floorY = 150;
      } else if (this.config.formMode === 'cylinder') {
        this.floorY = this.cylinderBottomY;
      }
    } else {
      this.floorY = 150;
    }
    
    this.createSubPointsAndConstraints();
  }
  
  createClothPoints_Plane(startX, startY, startZ) {
    const { rows, cols, pinningMode } = this.config;
    
    for (let y = 0; y < rows; y++) {
      this.grid[y] = [];
      for (let x = 0; x < cols; x++) {
        let px = startX + x * this.config.spacing;
        let py = startY + y * this.config.spacing;
        let pz = startZ;
        let pinned = false;
        
        if (pinningMode === "top") {
          pinned = (y === 0);
        } else if (pinningMode === "corners") {
          pinned = (
            (x === 0 && y === 0) ||
            (x === cols-1 && y === 0) ||
            (x === 0 && y === rows-1) ||
            (x === cols-1 && y === rows-1)
          );
        }
        
        this.clothPoints.push({
          x: px, y: py, z: pz,
          oldx: px, oldy: py, oldz: pz,
          pinned: pinned
        });
        
        this.grid[y][x] = this.clothPoints.length - 1;
      }
    }
  }
  
  createClothPoints_Draped(startX, fixedY, startZ) {
    const { rows, cols } = this.config;
    
    for (let rz = 0; rz < rows; rz++) {
      this.grid[rz] = [];
      for (let cx = 0; cx < cols; cx++) {
        let px = startX + cx * this.config.spacing;
        let py = fixedY;
        let pz = startZ + rz * this.config.spacing;
        
        this.clothPoints.push({
          x: px, y: py, z: pz,
          oldx: px, oldy: py, oldz: pz,
          pinned: false
        });
        
        this.grid[rz][cx] = this.clothPoints.length - 1;
      }
    }
  }
  
  createSubPointsAndConstraints() {
    const { rows, cols } = this.config;
    
    // Create horizontal midpoints
    this.horizontal = [];
    for (let y = 0; y < rows; y++) {
      this.horizontal[y] = [];
      for (let x = 0; x < cols - 1; x++) {
        let idxA = this.grid[y][x];
        let idxB = this.grid[y][x+1];
        let A = this.clothPoints[idxA];
        let B = this.clothPoints[idxB];
        let mx = (A.x + B.x) * 0.5;
        let my = (A.y + B.y) * 0.5;
        let mz = (A.z + B.z) * 0.5;
        
        this.clothPoints.push({
          x: mx, y: my, z: mz,
          oldx: mx, oldy: my, oldz: mz,
          pinned: false
        });
        
        this.horizontal[y][x] = this.clothPoints.length - 1;
      }
    }
    
    // Create vertical midpoints
    this.vertical = [];
    for (let y = 0; y < rows - 1; y++) {
      this.vertical[y] = [];
      for (let x = 0; x < cols; x++) {
        let idxA = this.grid[y][x];
        let idxB = this.grid[y+1][x];
        let A = this.clothPoints[idxA];
        let B = this.clothPoints[idxB];
        let mx = (A.x + B.x) * 0.5;
        let my = (A.y + B.y) * 0.5;
        let mz = (A.z + B.z) * 0.5;
        
        this.clothPoints.push({
          x: mx, y: my, z: mz,
          oldx: mx, oldy: my, oldz: mz,
          pinned: false
        });
        
        this.vertical[y][x] = this.clothPoints.length - 1;
      }
    }
    
    // Create center points and calculate rest areas
    this.centers = [];
    this.cellRestArea = [];
    for (let y = 0; y < rows - 1; y++) {
      this.centers[y] = [];
      this.cellRestArea[y] = [];
      for (let x = 0; x < cols - 1; x++) {
        let idxA = this.grid[y][x];
        let idxB = this.grid[y][x+1];
        let idxC = this.grid[y+1][x];
        let idxD = this.grid[y+1][x+1];
        let A = this.clothPoints[idxA];
        let B = this.clothPoints[idxB];
        let C = this.clothPoints[idxC];
        let D = this.clothPoints[idxD];
        let mx = (A.x + B.x + C.x + D.x) * 0.25;
        let my = (A.y + B.y + C.y + D.y) * 0.25;
        let mz = (A.z + B.z + C.z + D.z) * 0.25;
        
        this.clothPoints.push({
          x: mx, y: my, z: mz,
          oldx: mx, oldy: my, oldz: mz,
          pinned: false
        });
        
        this.centers[y][x] = this.clothPoints.length - 1;
        let restArea = this.computeQuadArea(A, B, C, D);
        this.cellRestArea[y][x] = restArea;
      }
    }
    
    this.createConstraints();
  }
  
  computeQuadArea(A, B, C, D) {
    let area1 = this.triArea(A, B, C);
    let area2 = this.triArea(B, C, D);
    return area1 + area2;
  }
  
  triArea(p1, p2, p3) {
    let ux = p2.x - p1.x;
    let uy = p2.y - p1.y;
    let uz = p2.z - p1.z;
    let vx = p3.x - p1.x;
    let vy = p3.y - p1.y;
    let vz = p3.z - p1.z;
    let cx = uy * vz - uz * vy;
    let cy = uz * vx - ux * vz;
    let cz = ux * vy - uy * vx;
    return 0.5 * Math.sqrt(cx*cx + cy*cy + cz*cz);
  }
  
  createConstraints() {
    const { rows, cols } = this.config;
    const { STRUCTURAL, SHEAR, BENDING } = CONSTRAINT_TYPES;
    
    // Structural constraints
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let idx = this.grid[y][x];
        if (x < cols - 1) {
          this.addConstraint(
            idx, 
            this.grid[y][x+1],
            this.config.spacing * (this.stretchActive ? this.config.stretchFactor : this.BASE_STRETCH),
            STRUCTURAL
          );
        }
        if (y < rows - 1) {
          this.addConstraint(
            idx, 
            this.grid[y+1][x],
            this.config.spacing * (this.stretchActive ? this.config.stretchFactor : this.BASE_STRETCH),
            STRUCTURAL
          );
        }
      }
    }
    
    // Bending constraints
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols - 2; x++) {
        this.addConstraint(
          this.grid[y][x], 
          this.grid[y][x+2],
          this.config.spacing * 2 * (this.bendingActive ? this.config.bendingFactor : this.BASE_BENDING),
          BENDING
        );
      }
    }
    
    for (let y = 0; y < rows - 2; y++) {
      for (let x = 0; x < cols; x++) {
        this.addConstraint(
          this.grid[y][x], 
          this.grid[y+2][x],
          this.config.spacing * 2 * (this.bendingActive ? this.config.bendingFactor : this.BASE_BENDING),
          BENDING
        );
      }
    }
    
    // Shear constraints
    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols - 1; x++) {
        let idxA = this.grid[y][x];
        let idxB = this.grid[y][x+1];
        let idxC = this.grid[y+1][x];
        let idxD = this.grid[y+1][x+1];
        
        this.addConstraint(
          idxA, 
          idxD,
          Math.sqrt(2) * this.config.spacing * (this.shearActive ? this.config.shearFactor : this.BASE_SHEAR),
          SHEAR
        );
        
        this.addConstraint(
          idxB, 
          idxC,
          Math.sqrt(2) * this.config.spacing * (this.shearActive ? this.config.shearFactor : this.BASE_SHEAR),
          SHEAR
        );
      }
    }
    
    // Subdivide (triangulate for stability)
    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols - 1; x++) {
        let A = this.grid[y][x];
        let B = this.grid[y][x+1];
        let C = this.grid[y+1][x];
        let D = this.grid[y+1][x+1];
        let E = this.horizontal[y][x];
        let F = this.horizontal[y+1][x];
        let G = this.vertical[y][x];
        let H = this.vertical[y][x+1];
        let I = this.centers[y][x];
        
        this.addTriConstraints(A, E, I);
        this.addTriConstraints(A, G, I);
        this.addTriConstraints(B, E, I);
        this.addTriConstraints(B, H, I);
        this.addTriConstraints(C, G, I);
        this.addTriConstraints(C, F, I);
        this.addTriConstraints(D, H, I);
        this.addTriConstraints(D, F, I);
      }
    }
  }
  
  addTriConstraints(i1, i2, i3) {
    let dist1 = this.distBetween(i1, i2);
    let dist2 = this.distBetween(i2, i3);
    let dist3 = this.distBetween(i3, i1);
    
    this.addConstraint(i1, i2, dist1, CONSTRAINT_TYPES.STRUCTURAL);
    this.addConstraint(i2, i3, dist2, CONSTRAINT_TYPES.STRUCTURAL);
    this.addConstraint(i3, i1, dist3, CONSTRAINT_TYPES.STRUCTURAL);
  }
  
  addConstraint(i, j, len, type) {
    let a = Math.min(i, j);
    let b = Math.max(i, j);
    
    // Check if constraint already exists
    for (let c of this.clothConstraints) {
      if (c.p1 === a && c.p2 === b) return;
    }
    
    this.clothConstraints.push({ p1: a, p2: b, length: len, type });
  }
  
  distBetween(i1, i2) {
    let p1 = this.clothPoints[i1];
    let p2 = this.clothPoints[i2];
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    let dz = p2.z - p1.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }
  
  update() {
    this.frameCount++;
    
    // Update physics
    let freq = 0.01;
    for (let p of this.clothPoints) {
      if (!p.pinned) {
        // Apply damping
        let vx = (p.x - p.oldx) * (this.dampingActive ? this.config.damping : this.BASE_DAMPING);
        let vy = (p.y - p.oldy) * (this.dampingActive ? this.config.damping : this.BASE_DAMPING);
        let vz = (p.z - p.oldz) * (this.dampingActive ? this.config.damping : this.BASE_DAMPING);
        
        // Store old position
        p.oldx = p.x;
        p.oldy = p.y;
        p.oldz = p.z;
        
        // Apply wind (with sine wave movement)
        let sinVal = Math.sin(this.frameCount * freq);
        let effectiveWindX = this.windXActive ? this.config.windBuffer * this.config.windX * sinVal : this.BASE_WINDX;
        let effectiveWindY = this.windYActive ? this.config.windBuffer * this.config.windY * sinVal : this.BASE_WINDY;
        let effectiveWindZ = this.windZActive ? this.config.windBuffer * this.config.windZ * sinVal : this.BASE_WINDZ;
        
        // Apply gravity and weight
        let effGrav = this.gravityActive ? this.config.gravity : this.BASE_GRAVITY;
        let effWeight = this.weightActive ? this.config.weight : this.BASE_WEIGHT;
        
        // Update position with velocity + forces
        p.x += vx + effectiveWindX;
        p.y += vy + effGrav * effWeight + effectiveWindY;
        p.z += vz + effectiveWindZ;
      }
    }
    
    // Apply constraints (multiple iterations for stability)
    let effIter = this.iterationsActive ? this.config.iterations : this.BASE_ITERATIONS;
    for (let i = 0; i < effIter; i++) {
      for (let c of this.clothConstraints) {
        let p1 = this.clothPoints[c.p1];
        let p2 = this.clothPoints[c.p2];
        
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let dz = p2.z - p1.z;
        let distVal = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        // Skip if distance is zero to avoid division by zero
        if (distVal === 0) continue;
        
        let diff = (distVal - c.length) / distVal;
        let offsetX = dx * 0.5 * diff;
        let offsetY = dy * 0.5 * diff;
        let offsetZ = dz * 0.5 * diff;
        
        if (!p1.pinned) {
          p1.x += offsetX;
          p1.y += offsetY;
          p1.z += offsetZ;
        }
        
        if (!p2.pinned) {
          p2.x -= offsetX;
          p2.y -= offsetY;
          p2.z -= offsetZ;
        }
      }
    }
    
    // Handle collisions
    this.doSelfCollision();
    
    if (this.config.simulationMode === 'draped') {
      if (this.config.formMode === 'sphere') {
        this.doSphereCollision();
      } else if (this.config.formMode === 'cylinder') {
        this.doCylinderCollision();
      }
      this.doFloorCollision();
    }
  }
  
  doSelfCollision() {
    let threshold = this.config.spacing * 0.5;
    for (let i = 0; i < this.clothPoints.length; i++) {
      for (let j = i + 1; j < this.clothPoints.length; j++) {
        let p1 = this.clothPoints[i];
        let p2 = this.clothPoints[j];
        
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let dz = p2.z - p1.z;
        let d = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (d < threshold && d > 0) {
          let overlap = threshold - d;
          let angle = Math.atan2(dy, dx);
          
          if (!p1.pinned && !p2.pinned) {
            p1.x -= Math.cos(angle) * overlap * 0.5;
            p1.y -= Math.sin(angle) * overlap * 0.5;
            p2.x += Math.cos(angle) * overlap * 0.5;
            p2.y += Math.sin(angle) * overlap * 0.5;
          } else if (!p1.pinned && p2.pinned) {
            p1.x -= Math.cos(angle) * overlap;
            p1.y -= Math.sin(angle) * overlap;
          } else if (p1.pinned && !p2.pinned) {
            p2.x += Math.cos(angle) * overlap;
            p2.y += Math.sin(angle) * overlap;
          }
        }
      }
    }
  }
  
  doSphereCollision() {
    const collisionFriction = 0.5;
    for (let p of this.clothPoints) {
      if (!p.pinned) {
        let dx = p.x - this.sphereCentre.x;
        let dy = p.y - this.sphereCentre.y;
        let dz = p.z - this.sphereCentre.z;
        let distVal = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (distVal < this.sphereRadius) {
          let overlap = this.sphereRadius - distVal;
          let nx = dx / distVal;
          let ny = dy / distVal;
          let nz = dz / distVal;
          
          p.x += nx * overlap;
          p.y += ny * overlap;
          p.z += nz * overlap;
          
          // Apply friction
          p.oldx = p.x - collisionFriction * (p.x - p.oldx);
          p.oldy = p.y - collisionFriction * (p.y - p.oldy);
          p.oldz = p.z - collisionFriction * (p.z - p.oldz);
        }
      }
    }
  }
  
  doCylinderCollision() {
    const collisionFriction = 0.5;
    for (let p of this.clothPoints) {
      if (!p.pinned) {
        if (p.y > this.cylinderTopY && p.y < this.cylinderBottomY) {
          let r = Math.sqrt(p.x*p.x + p.z*p.z);
          
          if (r < this.cylRadius) {
            let overlap = this.cylRadius - r;
            
            // Skip if at center to avoid division by zero
            if (r === 0) continue;
            
            let nx = p.x / r;
            let nz = p.z / r;
            
            p.x += nx * overlap;
            p.z += nz * overlap;
            
            // Apply friction
            p.oldx = p.x - collisionFriction * (p.x - p.oldx);
            p.oldz = p.z - collisionFriction * (p.z - p.oldz);
          }
        }
      }
    }
  }
  
  doFloorCollision() {
    const collisionFriction = 0.5;
    for (let p of this.clothPoints) {
      if (!p.pinned && p.y > this.floorY) {
        p.y = this.floorY;
        p.oldy = p.y - collisionFriction * (p.y - p.oldy);
      }
    }
  }
  
  // Utility method to get average movement (useful for UI feedback)
  getAverageMovement() {
    let totalMovement = 0;
    for (let p of this.clothPoints) {
      if (!p.pinned) {
        let dx = p.x - p.oldx;
        let dy = p.y - p.oldy;
        let dz = p.z - p.oldz;
        totalMovement += Math.sqrt(dx*dx + dy*dy + dz*dz);
      }
    }
    return totalMovement / this.clothPoints.length;
  }
  
  // Method to update a specific parameter
  setParameter(param, value, active = true) {
    if (this.config.hasOwnProperty(param)) {
      this.config[param] = value;
      
      // Also set the active state if appropriate
      const activeParam = `${param}Active`;
      if (this.hasOwnProperty(activeParam)) {
        this[activeParam] = active;
      }
    }
  }
  
  // Method to toggle a parameter on/off
  toggleParameter(param, active) {
    const activeParam = `${param}Active`;
    if (this.hasOwnProperty(activeParam)) {
      this[activeParam] = active;
    }
  }
  
  // Reset cloth to initial state
  reset() {
    this.setupCloth();
  }
}
