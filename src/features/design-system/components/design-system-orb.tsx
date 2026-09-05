'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import type { Group } from 'three';

function CoreScene({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<Group>(null);

  useFrame((state, delta) => {
    if (reducedMotion || !group.current) return;
    group.current.rotation.y += delta * 0.22;
    group.current.rotation.x += (state.pointer.y * 0.16 - group.current.rotation.x) * 0.035;
    group.current.rotation.z += (state.pointer.x * -0.1 - group.current.rotation.z) * 0.035;
  });

  return (
    <group ref={group} rotation={[0.12, -0.35, 0]}>
      <mesh castShadow>
        <icosahedronGeometry args={[1.08, 2]} />
        <meshStandardMaterial color="#DC2011" metalness={0.72} roughness={0.22} />
      </mesh>
      <mesh rotation={[Math.PI / 2.5, 0.25, 0]}>
        <torusGeometry args={[1.62, 0.025, 8, 72]} />
        <meshBasicMaterial color="#EFDFC5" transparent opacity={0.72} />
      </mesh>
      <mesh rotation={[-0.55, 0.2, Math.PI / 2]}>
        <torusGeometry args={[1.35, 0.016, 8, 64]} />
        <meshBasicMaterial color="#D9A441" transparent opacity={0.65} />
      </mesh>
      <mesh rotation={[0.35, Math.PI / 2, -0.4]}>
        <torusGeometry args={[1.85, 0.012, 8, 64]} />
        <meshBasicMaterial color="#8F0B13" transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

export function DesignSystemOrb() {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 300 }} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5.4], fov: 42 }}
        frameloop={reducedMotion ? 'demand' : 'always'}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={1.25} />
        <directionalLight position={[3, 4, 5]} intensity={3.2} color="#EFDFC5" />
        <pointLight position={[-3, -1, 2]} intensity={20} color="#DC2011" distance={7} />
        <CoreScene reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
