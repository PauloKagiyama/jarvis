import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh } from 'three';
import * as THREE from 'three';

interface ArcReactorProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  taskComplexity: number;
  audioLevel: number;
}

const ArcReactor: React.FC<ArcReactorProps> = ({ state, taskComplexity, audioLevel }) => {
  const groupRef = useRef<Group>(null);
  const outerRingRef = useRef<Mesh>(null);
  const middleRingRef = useRef<Mesh>(null);
  const innerRingRef = useRef<Mesh>(null);
  const coreRef = useRef<Mesh>(null);
  const segmentRefs = useRef<Mesh[]>([]);
  const innerSegmentRefs = useRef<Mesh[]>([]);

  // Add particle system for enhanced visual effects
  const particleRefs = useRef<Mesh[]>([]);
  const particleCount = 50;
  
  // Add waveform visualization in the center
  const waveformRefs = useRef<Mesh[]>([]);
  const waveformCount = 16;

  // Create triangular/trapezoidal segments like in the reference
  const segmentGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    // Create a trapezoidal shape
    shape.moveTo(0, 1.2);
    shape.lineTo(-0.4, 0.8);
    shape.lineTo(-0.3, 0.3);
    shape.lineTo(0.3, 0.3);
    shape.lineTo(0.4, 0.8);
    shape.lineTo(0, 1.2);
    return new THREE.ShapeGeometry(shape);
  }, []);

  const innerSegmentGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    // Smaller inner segments
    shape.moveTo(0, 0.6);
    shape.lineTo(-0.2, 0.4);
    shape.lineTo(-0.15, 0.2);
    shape.lineTo(0.15, 0.2);
    shape.lineTo(0.2, 0.4);
    shape.lineTo(0, 0.6);
    return new THREE.ShapeGeometry(shape);
  }, []);

  // Particle geometry for floating energy particles
  const particleGeometry = useMemo(() => new THREE.SphereGeometry(0.02, 8, 8), []);

  // Waveform geometry for center visualization
  const waveformGeometry = useMemo(() => new THREE.BoxGeometry(0.02, 1, 0.02), []);
  useFrame((frameState) => {
    const time = frameState.clock.getElapsedTime();
    
    // Smooth main rotation
    if (groupRef.current) {
      groupRef.current.rotation.z = time * 0.15;
    }
    
    // Outer ring - smooth pulsing animation
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = -time * 0.25;
      
      // Smooth intensity pulsing based on state
      const baseIntensity = state === 'thinking' ? 1.3 : 
                           state === 'listening' ? 1.2 : 
                           state === 'speaking' ? 1.4 : 1;
      
      // Smooth audio response for listening state
      const audioResponse = state === 'listening' ? audioLevel * 0.2 : 0;
      const smoothPulse = Math.sin(time * 1.5) * 0.05;
      const scale = 1 + smoothPulse * baseIntensity + audioResponse;
      outerRingRef.current.scale.setScalar(scale);
    }
    
    // Middle ring
    if (middleRingRef.current) {
      middleRingRef.current.rotation.z = time * 0.35;
    }
    
    // Inner ring counter-rotation
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = -time * 0.45;
    }
    
    // Core with smooth pulsing and audio response
    if (coreRef.current) {
      const powerLevel = state === 'thinking' ? 1.4 : 
                        state === 'listening' ? 1.2 : 
                        state === 'speaking' ? 1.5 : 1;
      
      // Smooth audio visualization for speaking
      const audioResponse = state === 'speaking' ? Math.sin(time * 6) * 0.15 : 0;
      const smoothCorePulse = Math.sin(time * 2) * 0.08;
      const scale = 1 + smoothCorePulse * powerLevel + audioResponse;
      coreRef.current.scale.setScalar(scale);
    }
    
    // Outer segments with smooth individual animation
    segmentRefs.current.forEach((segment, index) => {
      if (segment) {
        const offset = (index / 12) * Math.PI * 2;
        const rotationSpeed = 0.08;
        segment.rotation.z = time * rotationSpeed + offset;
        
        // Smooth wave effect
        const pulseOffset = index * 0.5;
        const wave = Math.sin(time * 1.2 + pulseOffset) * 0.03;
        const scale = 1 + wave;
        segment.scale.setScalar(scale);
      }
    });

    // Inner segments
    innerSegmentRefs.current.forEach((segment, index) => {
      if (segment) {
        const offset = (index / 8) * Math.PI * 2;
        segment.rotation.z = -time * 0.12 + offset;
        
        const pulseOffset = index * 0.8;
        const wave = Math.sin(time * 1.8 + pulseOffset) * 0.04;
        const scale = 1 + wave;
        segment.scale.setScalar(scale);
      }
    });

    // Animate floating particles around the reactor
    particleRefs.current.forEach((particle, index) => {
      if (particle) {
        const radius = 4 + Math.sin(time * 0.5 + index) * 0.5;
        const angle = time * 0.3 + (index / particleCount) * Math.PI * 2;
        const height = Math.sin(time * 0.8 + index * 0.5) * 0.3;
        
        particle.position.x = Math.cos(angle) * radius;
        particle.position.y = Math.sin(angle) * radius;
        particle.position.z = height;
        
        // Fade particles based on state
        const opacity = state === 'thinking' ? 0.8 : 
                       state === 'listening' ? 0.6 : 
                       state === 'speaking' ? 1.0 : 0.4;
        
        if (particle.material instanceof THREE.MeshPhysicalMaterial) {
          particle.material.opacity = opacity * (0.5 + Math.sin(time * 2 + index) * 0.3);
        }
      }
    });

    // Animate center waveforms based on audio level and state
    waveformRefs.current.forEach((waveform, index) => {
      if (waveform) {
        const angle = (index / waveformCount) * Math.PI * 2;
        const radius = 0.3; // Keep waveforms in center circle
        
        // Position waveforms in a circle - ABSOLUTELY NO ROTATION OF ANY KIND
        waveform.position.x = Math.cos(angle) * radius;
        waveform.position.z = Math.sin(angle) * radius;
        waveform.position.y = 0;
        
        // CRITICAL: Keep waveforms completely upright - ZERO ROTATION
        waveform.rotation.set(0, 0, 0);
        
        // FORCE the waveform to stay upright by overriding any rotation
        waveform.rotation.x = 0;
        waveform.rotation.y = 0;
        waveform.rotation.z = 0;
        
        // Animate height based on audio level and state
        let baseHeight = 0.2;
        let audioResponse = 0;
        
        if (state === 'listening') {
          audioResponse = audioLevel * 0.8 + Math.sin(time * 8 + index * 0.5) * 0.3;
        } else if (state === 'speaking') {
          audioResponse = Math.sin(time * 12 + index * 0.8) * 0.6 + Math.cos(time * 6 + index * 0.3) * 0.4;
        } else if (state === 'thinking') {
          audioResponse = Math.sin(time * 4 + index * 0.4) * 0.4;
        } else {
          audioResponse = Math.sin(time * 2 + index * 0.2) * 0.1;
        }
        
        const height = baseHeight + Math.max(0, audioResponse);
        waveform.scale.y = height;
      }
    });
  });

  // Dynamic colors based on state
  const getReactorColor = () => {
    if (taskComplexity > 0.7) return new THREE.Color(0xff4444); // Red for high complexity
    switch (state) {
      case 'listening': return new THREE.Color(0x00ffff); // Cyan
      case 'thinking': return new THREE.Color(0x4fc3f7);  // Light blue
      case 'speaking': return new THREE.Color(0x00e5ff);  // Bright cyan
      default: return new THREE.Color(0x00d4ff);          // Classic blue
    }
  };

  const reactorColor = getReactorColor();

  // Enhanced materials with better lighting
  const outerRingMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x333333,
    metalness: 0.95,
    roughness: 0.05,
    transparent: true,
    opacity: 0.9,
    emissive: reactorColor,
    emissiveIntensity: 0.4,
  }), [reactorColor]);

  const middleRingMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x444444,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.8,
    emissive: reactorColor,
    emissiveIntensity: 0.3,
  }), [reactorColor]);

  const innerRingMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x555555,
    metalness: 0.85,
    roughness: 0.15,
    transparent: true,
    opacity: 0.7,
    emissive: reactorColor,
    emissiveIntensity: 0.2,
  }), [reactorColor]);

  const coreMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: reactorColor,
    metalness: 0.3,
    roughness: 0.1,
    transparent: true,
    opacity: 0.95,
    emissive: reactorColor,
    emissiveIntensity: 0.8,
    transmission: 0.4,
    thickness: 0.3,
  }), [reactorColor]);

  const segmentMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x666666,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.8,
    emissive: reactorColor,
    emissiveIntensity: 0.3,
    side: THREE.DoubleSide,
  }), [reactorColor]);

  const innerSegmentMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x777777,
    metalness: 0.85,
    roughness: 0.15,
    transparent: true,
    opacity: 0.7,
    emissive: reactorColor,
    emissiveIntensity: 0.25,
    side: THREE.DoubleSide,
  }), [reactorColor]);

  const particleMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: reactorColor,
    metalness: 0.1,
    roughness: 0.1,
    transparent: true,
    opacity: 0.6,
    emissive: reactorColor,
    emissiveIntensity: 0.5,
  }), [reactorColor]);

  const waveformMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: reactorColor,
    metalness: 0.2,
    roughness: 0.1,
    transparent: true,
    opacity: 0.8,
    emissive: reactorColor,
    emissiveIntensity: 0.6,
  }), [reactorColor]);
  return (
    <group ref={groupRef} scale={[0.6, 0.6, 0.6]} position={[0, 0, 0]}>
      {/* Outer Ring */}
      <mesh ref={outerRingRef} material={outerRingMaterial}>
        <torusGeometry args={[3.2, 0.08, 16, 64]} />
      </mesh>
      
      {/* Middle Ring */}
      <mesh ref={middleRingRef} material={middleRingMaterial}>
        <torusGeometry args={[2.6, 0.06, 16, 64]} />
      </mesh>
      
      {/* Inner Ring */}
      <mesh ref={innerRingRef} material={innerRingMaterial}>
        <torusGeometry args={[2.0, 0.04, 16, 64]} />
      </mesh>
      
      {/* Central Core */}
      <mesh ref={coreRef} material={coreMaterial}>
        <cylinderGeometry args={[0.8, 0.8, 0.15, 32]} />
      </mesh>
      
      {/* Center Waveform Visualization */}
      {Array.from({ length: waveformCount }, (_, i) => (
        <mesh
          key={`waveform-${i}`}
          ref={(el) => {
            if (el) waveformRefs.current[i] = el;
          }}
          geometry={waveformGeometry}
          material={waveformMaterial}
        />
      ))}
      
      {/* Outer Segments (12 pieces) */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 2.8;
        
        return (
          <mesh
            key={`outer-${i}`}
            ref={(el) => {
              if (el) segmentRefs.current[i] = el;
            }}
            position={[
              Math.cos(angle) * radius,
              Math.sin(angle) * radius,
              0.08
            ]}
            rotation={[0, 0, angle + Math.PI / 2]}
            scale={[0.3, 0.3, 1]}
            material={segmentMaterial}
            geometry={segmentGeometry}
          />
        );
      })}

      {/* Inner Segments (8 pieces) */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 1.6;
        
        return (
          <mesh
            key={`inner-${i}`}
            ref={(el) => {
              if (el) innerSegmentRefs.current[i] = el;
            }}
            position={[
              Math.cos(angle) * radius,
              Math.sin(angle) * radius,
              0.05
            ]}
            rotation={[0, 0, angle + Math.PI / 2]}
            scale={[0.4, 0.4, 1]}
            material={innerSegmentMaterial}
            geometry={innerSegmentGeometry}
          />
        );
      })}
      
      {/* Floating Energy Particles */}
      {Array.from({ length: particleCount }, (_, i) => (
        <mesh
          key={`particle-${i}`}
          ref={(el) => {
            if (el) particleRefs.current[i] = el;
          }}
          geometry={particleGeometry}
          material={particleMaterial}
        />
      ))}
      
      {/* Enhanced Lighting System */}
      <pointLight 
        position={[0, 0, 2]} 
        intensity={2 + taskComplexity * 0.8} 
        color={reactorColor}
        distance={12}
        decay={1.5}
      />
      
      {/* Rim lighting for depth */}
      <spotLight
        position={[0, 0, 4]}
        angle={Math.PI / 2.5}
        penumbra={0.3}
        intensity={1.2}
        color={reactorColor}
        target-position={[0, 0, 0]}
      />

      {/* Additional ambient glow */}
      <pointLight 
        position={[0, 0, -1]} 
        intensity={0.8} 
        color={reactorColor}
        distance={8}
        decay={2}
      />
      
      {/* Dynamic environment lighting */}
      <hemisphereLight
        skyColor={reactorColor}
        groundColor={new THREE.Color(0x000033)}
        intensity={0.3}
      />
    </group>
  );
};

export default ArcReactor;