'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Torus, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

interface R3FEsportsStageProps {
  accentColor?: string;
  glowColor?: string;
  className?: string;
}

function FloatingCrystalShield({ accentColor = '#00F0FF', glowColor = '#C084FC' }: { accentColor?: string; glowColor?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const mouseX = state.pointer.x * 0.4;
    const mouseY = state.pointer.y * 0.4;

    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.5 + mouseX;
      meshRef.current.rotation.x = Math.sin(time * 0.3) * 0.2 - mouseY;
    }
    if (ringRef1.current) {
      ringRef1.current.rotation.x = time * 0.8 + mouseY;
      ringRef1.current.rotation.y = time * 0.4;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.y = -time * 0.6 + mouseX;
      ringRef2.current.rotation.z = time * 0.3;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Central Floating Polyhedron / Crystal Core */}
      <Float speed={2} rotationIntensity={0.8} floatIntensity={1.2}>
        <mesh ref={meshRef} scale={1.3}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={0.6}
            roughness={0.15}
            metalness={0.85}
            wireframe={false}
          />
        </mesh>
      </Float>

      {/* Outer Holographic Energy Distortion Field */}
      <Sphere args={[1.5, 32, 32]} scale={1.1}>
        <MeshDistortMaterial
          color={glowColor}
          attach="material"
          distort={0.35}
          speed={2}
          roughness={0.2}
          transparent
          opacity={0.3}
          wireframe
        />
      </Sphere>

      {/* Orbital Ring 1 */}
      <mesh ref={ringRef1}>
        <torusGeometry args={[2.2, 0.03, 16, 64]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={1.2} />
      </mesh>

      {/* Orbital Ring 2 */}
      <mesh ref={ringRef2}>
        <torusGeometry args={[2.6, 0.02, 16, 64]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.5} />
      </mesh>

      {/* Holographic Esports Sparkle Cloud */}
      <Sparkles count={45} scale={5} size={3} speed={0.4} color={accentColor} />
    </group>
  );
}

export function R3FEsportsStage({ accentColor = '#00F0FF', glowColor = '#C084FC', className = '' }: R3FEsportsStageProps) {
  return (
    <div className={`relative w-full h-[340px] sm:h-[400px] select-none ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ pointerEvents: 'auto' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} color="#FFFFFF" />
        <pointLight position={[-5, -5, -5]} intensity={1} color={accentColor} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color={glowColor} />
        <FloatingCrystalShield accentColor={accentColor} glowColor={glowColor} />
      </Canvas>
    </div>
  );
}
