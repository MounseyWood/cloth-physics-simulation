# Cloth Physics Simulation

A modern, interactive cloth physics simulation with a neumorphic UI design and progressive disclosure patterns. This project demonstrates advanced physics simulation techniques coupled with intuitive mobile-first UX design.

![Cloth Simulation Preview](docs/preview.png)

## Features

- Real-time cloth physics simulation with adjustable parameters
- Neumorphic UI with dark mode and soft shadow effects
- Progressive disclosure interface that adapts to user needs
- Multiple simulation modes (plane, draped over sphere or cylinder)
- Interactive parameter controls with real-time feedback
- Touch-optimized controls for mobile devices

## Live Demo

Try it out: [Cloth Physics Simulation Demo](https://your-username.github.io/cloth-physics-simulation)

## Screenshots

<table>
  <tr>
    <td><img src="docs/screenshot1.png" alt="Basic Parameters" width="400"/></td>
    <td><img src="docs/screenshot2.png" alt="Advanced Parameters" width="400"/></td>
  </tr>
  <tr>
    <td><img src="docs/screenshot3.png" alt="Draped Mode" width="400"/></td>
    <td><img src="docs/screenshot4.png" alt="Stress Visualization" width="400"/></td>
  </tr>
</table>

## Development

### Prerequisites

- Node.js 16.x or newer
- npm 8.x or newer

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/cloth-physics-simulation.git

# Navigate to the project
cd cloth-physics-simulation

# Install dependencies
npm install

# Start development server
npm start
```

### Building for Production

```bash
npm run build
```

## Technical Implementation

The application is built with the following technologies:

- **React** for the user interface
- **Three.js** for 3D cloth rendering
- **Framer Motion** for fluid animations
- **Custom physics engine** for cloth simulation

The cloth simulation uses a position-based dynamics approach with:

- Mass-spring system for cloth representation
- Verlet integration for physics calculations
- Custom implementations of stretch, shear, and bending constraints
- Collision detection for sphere and cylinder interactions

## Architecture

The project follows a modular architecture:

```
src/
├── components/       # Reusable UI components
│   ├── neumorphic/   # Neumorphic styled components
│   └── ...
├── hooks/            # Custom React hooks
├── lib/              # Core simulation logic
│   ├── clothEngine.js
│   └── renderer.js
└── screens/          # App screens
```

## Contributing

Contributions are welcome! Please check the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Original physics implementation inspired by [p5.js Cloth Simulation](https://p5js.org/examples/)
- Neumorphic design principles based on modern iOS/iPadOS interfaces
- Built with [React](https://reactjs.org/)
- 3D rendering powered by [Three.js](https://threejs.org/)
