import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import ArcReactor, { ReactorState } from './ArcReactor';

interface ReactorSceneProps {
  state: ReactorState;
  taskComplexity: number;
  audioLevel: number;
}

const ReactorScene: React.FC<ReactorSceneProps> = ({ state, taskComplexity, audioLevel }) => (
  <div className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing">
    {/* Bounce light on the backplate, sitting behind the canvas. */}
    <div className="absolute inset-0 backlight" />

    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 9], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        // Filmic response curve — highlights roll off instead of clipping to
        // flat white, which is most of what separates "lit" from "glowing".
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.setClearColor('#000000', 0);
      }}
    >
      <Suspense fallback={null}>
        <ArcReactor state={state} taskComplexity={taskComplexity} audioLevel={audioLevel} />
        <ambientLight intensity={0.12} />
        <directionalLight position={[4, 6, 5]} intensity={0.6} color="#c3d4e0" />

        {/* The unit stays put; the camera orbits it. Panning is disabled so it
            can never be dragged out of frame, and damping gives the movement
            the weight of turning a real object over in your hands. */}
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.55}
          zoomSpeed={0.6}
          minDistance={5}
          maxDistance={16}
          minPolarAngle={Math.PI * 0.08}
          maxPolarAngle={Math.PI * 0.92}
        />
      </Suspense>
    </Canvas>
  </div>
);

export default ReactorScene;
