/**
 * 3D Cloth Renderer using Three.js
 * Handles visualization of the cloth simulation
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CONSTRAINT_TYPES } from './clothEngine';

export class ClothRenderer {
  constructor(clothSimulation) {
    this.cloth = clothSimulation;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    // Meshes
    this.clothMesh = null;
    this.wireframeMesh = null;
    this.pointsMesh = null;
    this.formMesh = null;
    this.floorMesh = null;
    
    // Rendering state
    this.shaderMaterial = null;
    this.shadingMode = 'overlaid'; // "off", "cloth", "overlaid", "stress", "structure"
    this.interactionMode = 'rotate'; // "rotate" or "drag"
    this.isInitialized = false;
    
    // Dragging
    this.draggedPoint = null;
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    this.dragIntersection = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }
  
  init(container) {
    if (this.isInitialized) return;
    
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1A1B1F);
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      60, 
      container.clientWidth / container.clientHeight, 
      0.1, 
      2000
    );
    this.camera.position.set(0, 0, 500);
    this.camera.lookAt(0, 0, 0);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);
    
    // Add orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
    
    // Create meshes
    this.createClothMeshes();
    
    // Add form (sphere or cylinder) if in draped mode
    if (this.cloth.config.simulationMode === 'draped') {
      this.addDrapedForm();
    }
    
    // Add floor
    this.addFloor();
    
    // Set up event listeners
    window.addEventListener('resize', () => this.onWindowResize(container));
    this.renderer.domElement.addEventListener('mousedown', (event) => this.onMouseDown(event));
    this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));
    this.renderer.domElement.addEventListener('mouseup', () => this.onMouseUp());
    
    this.isInitialized = true;
  }
  
  createClothMeshes() {
    // Create cloth geometry
    const geometry = new THREE.BufferGeometry();
    
    // Set up vertices and faces based on the simulation grid
    this.updateGeometryFromSimulation(geometry);
    
    // Create materials
    // Main cloth material (for solid rendering)
    const clothMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      side: THREE.DoubleSide,
      flatShading: true,
      transparent: true,
      opacity: 0.9
    });
    
    // Wireframe material
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 1
    });
    
    // Points material
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2
    });
    
    // Create meshes
    this.clothMesh = new THREE.Mesh(geometry, clothMaterial);
    this.wireframeMesh = new THREE.LineSegments(
      new THREE.WireframeGeometry(geometry),
      wireframeMaterial
    );
    this.pointsMesh = new THREE.Points(geometry, pointsMaterial);
    
    // Add meshes to scene
    this.scene.add(this.clothMesh);
    this.scene.add(this.wireframeMesh);
    this.scene.add(this.pointsMesh);
    
    // Initially set visibility based on shading mode
    this.updateShadingMode(this.shadingMode);
  }
  
  addDrapedForm() {
    if (this.formMesh) {
      this.scene.remove(this.formMesh);
    }
    
    const formMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      flatShading: false,
      transparent: false
    });
    
    if (this.cloth.config.formMode === 'sphere') {
      const sphereGeometry = new THREE.SphereGeometry(
        this.cloth.sphereRadius,
        32,
        32
      );
      this.formMesh = new THREE.Mesh(sphereGeometry, formMaterial);
      this.formMesh.position.set(
        this.cloth.sphereCentre.x,
        this.cloth.sphereCentre.y,
        this.cloth.sphereCentre.z
      );
    } else if (this.cloth.config.formMode === 'cylinder') {
      const cylinderHeight = this.cloth.cylHeight;
      const cylinderGeometry = new THREE.CylinderGeometry(
        this.cloth.cylRadius,
        this.cloth.cylRadius,
        cylinderHeight,
        32
      );
      this.formMesh = new THREE.Mesh(cylinderGeometry, formMaterial);
      // Position at midpoint of top and bottom
      const midY = (this.cloth.cylinderTopY + this.cloth.cylinderBottomY) / 2;
      this.formMesh.position.set(0, midY, 0);
    }
    
    this.scene.add(this.formMesh);
  }
  
  addFloor() {
    const floorGeometry = new THREE.PlaneGeometry(1000, 1000);
    const floorMaterial = new THREE.MeshBasicMaterial({
      color: 0x222222,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    
    this.floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floorMesh.rotation.x = Math.PI / 2;
    this.floorMesh.position.y = this.cloth.floorY;
    
    this.scene.add(this.floorMesh);
  }
  
  updateShadingMode(mode) {
    this.shadingMode = mode;
    
    // Update mesh visibility based on shading mode
    switch (mode) {
      case 'off':
        this.clothMesh.visible = false;
        this.wireframeMesh.visible = true;
        this.pointsMesh.visible = true;
        break;
        
      case 'cloth':
        this.clothMesh.visible = true;
        this.wireframeMesh.visible = false;
        this.pointsMesh.visible = false;
        
        // Update cloth material for solid shading
        this.clothMesh.material.opacity = 1.0;
        this.clothMesh.material.transparent = false;
        break;
        
      case 'overlaid':
        this.clothMesh.visible = true;
        this.wireframeMesh.visible = true;
        this.pointsMesh.visible = true;
        
        // Update cloth material for semi-transparent shading
        this.clothMesh.material.opacity = 0.7;
        this.clothMesh.material.transparent = true;
        break;
        
      case 'stress':
        this.clothMesh.visible = true;
        this.wireframeMesh.visible = false;
        this.pointsMesh.visible = false;
        
        // Update material for stress visualization
        // (Requires additional implementation for stress coloring)
        break;
        
      case 'structure':
        this.clothMesh.visible = false;
        this.wireframeMesh.visible = true;
        this.pointsMesh.visible = true;
        
        // Update wireframeMesh for structure visualization
        // (Requires coloring the wireframe by constraint type)
        break;
    }
  }
  
  updateGeometryFromSimulation(geometry = null) {
    if (!geometry) {
      if (!this.clothMesh) return;
      geometry = this.clothMesh.geometry;
    }
    
    const { rows, cols } = this.cloth.config;
    const grid = this.cloth.grid;
    
    // Extract vertices from cloth points
    const vertices = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const idx = grid[y][x];
        const point = this.cloth.clothPoints[idx];
        vertices.push(point.x, point.y, point.z);
      }
    }
    
    // Create faces (triangles)
    const indices = [];
    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols - 1; x++) {
        // Calculate indices for the four corners of this grid cell
        const a = y * cols + x;
        const b = y * cols + x + 1;
        const c = (y + 1) * cols + x;
        const d = (y + 1) * cols + x + 1;
        
        // Add two triangles to form a quad
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }
    
    // Set attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    
    // Update normals
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
    
    // If we're in stress visualization mode, update colors
    if (this.shadingMode === 'stress') {
      this.updateStressColors(geometry);
    }
    
    // If we're in structure visualization mode, update wireframe colors
    if (this.shadingMode === 'structure') {
      this.updateStructureColors();
    }
  }
  
  updateStressColors(geometry) {
    // Implement stress visualization based on cloth cell areas
    const { rows, cols } = this.cloth.config;
    const colors = [];
    
    // For each vertex, determine its color based on connected cells' stress
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // In a real implementation, we'd calculate stress based on
        // deviation from rest area or constraint extension
        
        // Placeholder coloring - can be enhanced with actual stress calculation
        let r = 0.5;
        let g = 0.5;
        let b = 0.8;
        
        // Simple coloring based on position for demonstration
        if (y > 0 && y < rows - 1 && x > 0 && x < cols - 1) {
          const idx = this.cloth.grid[y][x];
          const point = this.cloth.clothPoints[idx];
          
          // Movement-based coloring (red for moving parts)
          const vx = point.x - point.oldx;
          const vy = point.y - point.oldy;
          const vz = point.z - point.oldz;
          const speed = Math.sqrt(vx*vx + vy*vy + vz*vz);
          
          r = Math.min(1.0, 0.3 + speed * 10);
          g = Math.max(0.0, 0.7 - speed * 5);
          b = Math.max(0.0, 0.8 - speed * 5);
        }
        
        colors.push(r, g, b);
      }
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.clothMesh.material.vertexColors = true;
  }
  
  updateStructureColors() {
    // Placeholder for structure coloring of wireframe
    // In a full implementation, we'd create a custom wireframe with colors
    // per constraint type (structural, shear, bending)
  }
  
  setInteractionMode(mode) {
    this.interactionMode = mode;
    
    // Enable/disable orbit controls based on interaction mode
    this.controls.enabled = (mode === 'rotate');
  }
  
  onWindowResize(container) {
    if (!this.camera || !this.renderer) return;
    
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }
  
  onMouseDown(event) {
    if (this.interactionMode !== 'drag') return;
    
    // Calculate mouse position in normalized device coordinates
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update the raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Find closest point
    let closestDistance = Infinity;
    let closestPointIndex = null;
    
    for (let i = 0; i < this.cloth.clothPoints.length; i++) {
      const point = this.cloth.clothPoints[i];
      const pointVector = new THREE.Vector3(point.x, point.y, point.z);
      
      // Project point to screen
      pointVector.project(this.camera);
      
      // Calculate screen-space distance
      const dx = this.mouse.x - pointVector.x;
      const dy = this.mouse.y - pointVector.y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      if (distance < closestDistance && distance < 0.05) {
        closestDistance = distance;
        closestPointIndex = i;
      }
    }
    
    // Store dragged point if found
    if (closestPointIndex !== null) {
      this.draggedPoint = closestPointIndex;
      
      // Set drag plane to be perpendicular to camera
      const dragPoint = this.cloth.clothPoints[closestPointIndex];
      this.dragPlane.normal.copy(this.camera.getWorldDirection(new THREE.Vector3()));
      this.dragPlane.constant = -this.dragPlane.normal.dot(
        new THREE.Vector3(dragPoint.x, dragPoint.y, dragPoint.z)
      );
    }
  }
  
  onMouseMove(event) {
    if (this.interactionMode !== 'drag' || this.draggedPoint === null) return;
    
    // Calculate mouse position in normalized device coordinates
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update the raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Find intersection with drag plane
    if (this.raycaster.ray.intersectPlane(this.dragPlane, this.dragIntersection)) {
      const dragPoint = this.cloth.clothPoints[this.draggedPoint];
      
      // Skip if point is pinned
      if (dragPoint.pinned) return;
      
      // Update point position
      dragPoint.x = this.dragIntersection.x;
      dragPoint.y = this.dragIntersection.y;
      dragPoint.z = this.dragIntersection.z;
      
      // Also update old position to prevent velocity
      dragPoint.oldx = dragPoint.x;
      dragPoint.oldy = dragPoint.y;
      dragPoint.oldz = dragPoint.z;
    }
  }
  
  onMouseUp() {
    this.draggedPoint = null;
  }
  
  resetCamera() {
    if (!this.camera || !this.controls) return;
    
    this.camera.position.set(0, 0, 500);
    this.camera.lookAt(0, 0, 0);
    this.controls.reset();
  }
  
  render() {
    if (!this.isInitialized) return;
    
    // Update controls
    this.controls.update();
    
    // Update geometry from simulation points
    this.updateGeometryFromSimulation();
    
    // Update floor position
    if (this.floorMesh) {
      this.floorMesh.position.y = this.cloth.floorY;
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
  
  dispose() {
    // Clean up resources
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize);
    
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
      this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
      this.renderer.domElement.removeEventListener('mouseup', this.onMouseUp);
    }
  }
}
