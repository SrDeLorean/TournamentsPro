'use client';

import React, { useEffect, useRef } from 'react';

interface CyberSpaceCanvasProps {
  className?: string;
  density?: 'low' | 'medium' | 'high';
  showGrid?: boolean;
  interactive?: boolean;
  accentColor?: string;
}

interface Particle3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  baseSize: number;
  color: string;
  alpha: number;
  pulseSpeed: number;
  pulsePhase: number;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface WireframeShape {
  type: 'icosahedron' | 'ring' | 'cube';
  center: Point3D;
  size: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  speedX: number;
  speedY: number;
  speedZ: number;
  color: string;
  vertices: Point3D[];
  edges: [number, number][];
}

export function CyberSpaceCanvas({
  className = '',
  density = 'medium',
  showGrid = true,
  interactive = true,
  accentColor = '#00f0ff',
}: CyberSpaceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    // Mouse & Camera state
    const mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      radius: 200,
      isHovered: false,
    };

    const camera = {
      fov: 420,
      dist: 520,
      rotX: 0,
      rotY: 0,
      targetRotX: 0,
      targetRotY: 0,
    };

    // Color palette
    const colors = [
      '#00f0ff', // Cyber cyan
      '#c084fc', // Violet neon
      '#34d399', // Emerald
      '#fbbf24', // Gold
      '#38bdf8', // Sky blue
    ];

    // Build 3D Particles
    const particleCount = density === 'low' ? 70 : density === 'medium' ? 140 : 220;
    const particles: Particle3D[] = [];

    const spreadX = 1400;
    const spreadY = 1000;
    const spreadZ = 1200;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * spreadX,
        y: (Math.random() - 0.5) * spreadY,
        z: (Math.random() - 0.5) * spreadZ,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.4,
        baseSize: Math.random() * 2.2 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.7 + 0.3,
        pulseSpeed: Math.random() * 0.03 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Helper to generate Icosahedron vertices & edges
    function createIcosahedron(size: number, center: Point3D, color: string): WireframeShape {
      const phi = (1 + Math.sqrt(5)) / 2;
      const s = size / Math.sqrt(1 + phi * phi);
      const v: Point3D[] = [
        { x: -s, y: phi * s, z: 0 },
        { x: s, y: phi * s, z: 0 },
        { x: -s, y: -phi * s, z: 0 },
        { x: s, y: -phi * s, z: 0 },
        { x: 0, y: -s, z: phi * s },
        { x: 0, y: s, z: phi * s },
        { x: 0, y: -s, z: -phi * s },
        { x: 0, y: s, z: -phi * s },
        { x: phi * s, y: 0, z: -s },
        { x: phi * s, y: 0, z: s },
        { x: -phi * s, y: 0, z: -s },
        { x: -phi * s, y: 0, z: s },
      ];

      const edges: [number, number][] = [
        [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
        [1, 5], [1, 9], [1, 8], [1, 7],
        [2, 11], [2, 10], [2, 6], [2, 3], [2, 4],
        [3, 4], [3, 9], [3, 8], [3, 6],
        [4, 5], [4, 9], [4, 11],
        [5, 9], [5, 11],
        [6, 7], [6, 8], [6, 10],
        [7, 8], [7, 10],
        [8, 9],
        [10, 11]
      ];

      return {
        type: 'icosahedron',
        center,
        size,
        rotX: Math.random() * Math.PI,
        rotY: Math.random() * Math.PI,
        rotZ: Math.random() * Math.PI,
        speedX: 0.003 + Math.random() * 0.004,
        speedY: 0.004 + Math.random() * 0.004,
        speedZ: 0.002,
        color,
        vertices: v,
        edges,
      };
    }

    // Helper to generate a 3D cyber ring
    function createCyberRing(radius: number, segments: number, center: Point3D, color: string): WireframeShape {
      const v: Point3D[] = [];
      const edges: [number, number][] = [];
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        v.push({
          x: Math.cos(angle) * radius,
          y: 0,
          z: Math.sin(angle) * radius,
        });
        edges.push([i, (i + 1) % segments]);
      }
      return {
        type: 'ring',
        center,
        size: radius,
        rotX: Math.PI / 4,
        rotY: 0,
        rotZ: 0,
        speedX: 0.002,
        speedY: 0.006,
        speedZ: 0.001,
        color,
        vertices: v,
        edges,
      };
    }

    // 3D wireframe floating objects
    const shapes: WireframeShape[] = [
      createIcosahedron(85, { x: -380, y: -120, z: 100 }, '#00f0ff'),
      createIcosahedron(55, { x: 380, y: 180, z: -150 }, '#c084fc'),
      createCyberRing(160, 24, { x: -380, y: -120, z: 100 }, '#00f0ff66'),
      createCyberRing(110, 18, { x: 380, y: 180, z: -150 }, '#c084fc66'),
      createIcosahedron(40, { x: 120, y: -260, z: -50 }, '#fbbf24'),
    ];

    // Shockwave pulses
    interface Shockwave {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      alpha: number;
    }
    const shockwaves: Shockwave[] = [];

    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      mouse.targetX = clientX - width / 2;
      mouse.targetY = clientY - height / 2;
      mouse.isHovered = true;

      // Parallax camera tilt targets
      camera.targetRotY = (mouse.targetX / (width / 2)) * 0.35;
      camera.targetRotX = -(mouse.targetY / (height / 2)) * 0.35;
    };

    const handleMouseLeave = () => {
      mouse.isHovered = false;
      camera.targetRotX = 0;
      camera.targetRotY = 0;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      shockwaves.push({
        x: e.clientX - rect.left - width / 2,
        y: e.clientY - rect.top - height / 2,
        radius: 10,
        maxRadius: 350,
        alpha: 1,
      });
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseleave', handleMouseLeave);
      canvas.addEventListener('click', handleClick);
    }

    // 3D Matrix rotation helper
    function rotate3D(p: Point3D, rotX: number, rotY: number, rotZ: number): Point3D {
      // Rotate around X
      let y1 = p.y * Math.cos(rotX) - p.z * Math.sin(rotX);
      let z1 = p.y * Math.sin(rotX) + p.z * Math.cos(rotX);
      let x1 = p.x;

      // Rotate around Y
      let x2 = x1 * Math.cos(rotY) + z1 * Math.sin(rotY);
      let z2 = -x1 * Math.sin(rotY) + z1 * Math.cos(rotY);
      let y2 = y1;

      // Rotate around Z
      let x3 = x2 * Math.cos(rotZ) - y2 * Math.sin(rotZ);
      let y3 = x2 * Math.sin(rotZ) + y2 * Math.cos(rotZ);
      let z3 = z2;

      return { x: x3, y: y3, z: z3 };
    }

    // 3D Perspective Projection
    function project3D(p: Point3D, camDist: number, fov: number, cx: number, cy: number) {
      const zOffset = p.z + camDist;
      if (zOffset <= 10) return null; // Behind camera
      const scale = fov / zOffset;
      return {
        x: p.x * scale + cx,
        y: p.y * scale + cy,
        scale,
        depth: zOffset,
      };
    }

    // Grid animation tick
    let gridOffsetZ = 0;

    // Main animation loop
    let time = 0;
    const render = () => {
      time += 0.016;

      // Smooth camera interpolation
      camera.rotX += (camera.targetRotX - camera.rotX) * 0.06;
      camera.rotY += (camera.targetRotY - camera.rotY) * 0.06;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // --- 1. 3D CYBER GROUND GRID (Optional / Perspective Horizon) ---
      if (showGrid) {
        gridOffsetZ = (gridOffsetZ + 1.2) % 60;
        const gridY = 320;
        const gridZStart = -400;
        const gridZEnd = 900;
        const gridStep = 60;

        ctx.lineWidth = 1;

        // Longitudinal lines
        for (let gx = -1200; gx <= 1200; gx += 120) {
          const p1 = rotate3D({ x: gx, y: gridY, z: gridZStart }, camera.rotX, camera.rotY, 0);
          const p2 = rotate3D({ x: gx, y: gridY, z: gridZEnd }, camera.rotX, camera.rotY, 0);

          const proj1 = project3D(p1, camera.dist, camera.fov, cx, cy);
          const proj2 = project3D(p2, camera.dist, camera.fov, cx, cy);

          if (proj1 && proj2) {
            const grad = ctx.createLinearGradient(proj1.x, proj1.y, proj2.x, proj2.y);
            grad.addColorStop(0, 'rgba(0, 240, 255, 0)');
            grad.addColorStop(0.3, 'rgba(0, 240, 255, 0.12)');
            grad.addColorStop(1, 'rgba(192, 132, 252, 0.25)');
            ctx.strokeStyle = grad;
            ctx.beginPath();
            ctx.moveTo(proj1.x, proj1.y);
            ctx.lineTo(proj2.x, proj2.y);
            ctx.stroke();
          }
        }

        // Lateral lines
        for (let gz = gridZStart + gridOffsetZ; gz <= gridZEnd; gz += gridStep) {
          const p1 = rotate3D({ x: -1200, y: gridY, z: gz }, camera.rotX, camera.rotY, 0);
          const p2 = rotate3D({ x: 1200, y: gridY, z: gz }, camera.rotX, camera.rotY, 0);

          const proj1 = project3D(p1, camera.dist, camera.fov, cx, cy);
          const proj2 = project3D(p2, camera.dist, camera.fov, cx, cy);

          if (proj1 && proj2) {
            const distRatio = (gz - gridZStart) / (gridZEnd - gridZStart);
            const alpha = Math.sin(distRatio * Math.PI) * 0.18;
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(proj1.x, proj1.y);
            ctx.lineTo(proj2.x, proj2.y);
            ctx.stroke();
          }
        }
      }

      // --- 2. 3D SHOCKWAVES ---
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += 6;
        sw.alpha -= 0.02;

        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = `rgba(0, 240, 255, ${sw.alpha * 0.7})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(cx + sw.x, cy + sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // --- 3. 3D PARTICLES UPDATE & PROJECTION ---
      const projectedParticles: { proj: any; p: Particle3D }[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move particle
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Wrap around bounds
        if (p.x < -spreadX / 2) p.x = spreadX / 2;
        if (p.x > spreadX / 2) p.x = -spreadX / 2;
        if (p.y < -spreadY / 2) p.y = spreadY / 2;
        if (p.y > spreadY / 2) p.y = -spreadY / 2;
        if (p.z < -spreadZ / 2) p.z = spreadZ / 2;
        if (p.z > spreadZ / 2) p.z = -spreadZ / 2;

        // Rotate in 3D camera space
        const rotated = rotate3D(p, camera.rotX, camera.rotY, 0);
        const proj = project3D(rotated, camera.dist, camera.fov, cx, cy);

        if (proj) {
          projectedParticles.push({ proj, p });
        }
      }

      // Sort particles by depth for correct blending
      projectedParticles.sort((a, b) => b.proj.depth - a.proj.depth);

      // --- 4. 3D CONSTELLATION LINES ---
      const maxConnectDist = 110;
      for (let i = 0; i < projectedParticles.length; i++) {
        const pA = projectedParticles[i];
        for (let j = i + 1; j < projectedParticles.length; j++) {
          const pB = projectedParticles[j];
          const dx = pA.p.x - pB.p.x;
          const dy = pA.p.y - pB.p.y;
          const dz = pA.p.z - pB.p.z;
          const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist3D < maxConnectDist) {
            const alpha = (1 - dist3D / maxConnectDist) * 0.22 * ((pA.p.alpha + pB.p.alpha) / 2);
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.lineWidth = Math.max(0.5, pA.proj.scale * 1.2);
            ctx.beginPath();
            ctx.moveTo(pA.proj.x, pA.proj.y);
            ctx.lineTo(pB.proj.x, pB.proj.y);
            ctx.stroke();
          }
        }
      }

      // --- 5. DRAW 3D PARTICLES ---
      for (let i = 0; i < projectedParticles.length; i++) {
        const { proj, p } = projectedParticles[i];
        const pulse = Math.sin(time * 3 + p.pulsePhase) * 0.3 + 0.7;
        const size = p.baseSize * proj.scale * pulse * 1.5;
        const alpha = Math.min(1, Math.max(0.1, p.alpha * proj.scale * 1.2));

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = size * 4;

        ctx.beginPath();
        ctx.arc(proj.x, proj.y, Math.max(0.8, size), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // --- 6. 3D WIREFRAME SHAPES ---
      for (const shape of shapes) {
        shape.rotX += shape.speedX;
        shape.rotY += shape.speedY;
        shape.rotZ += shape.speedZ;

        // Transform shape vertices
        const transformedVertices: Point3D[] = [];
        for (const v of shape.vertices) {
          // Local rotation
          const localRotated = rotate3D(v, shape.rotX, shape.rotY, shape.rotZ);
          // Position relative to world
          const worldPos: Point3D = {
            x: localRotated.x + shape.center.x,
            y: localRotated.y + shape.center.y,
            z: localRotated.z + shape.center.z,
          };
          // Camera rotation
          const camRotated = rotate3D(worldPos, camera.rotX, camera.rotY, 0);
          transformedVertices.push(camRotated);
        }

        // Project vertices
        const projectedVertices = transformedVertices.map((v) =>
          project3D(v, camera.dist, camera.fov, cx, cy)
        );

        // Draw edges
        ctx.save();
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = 1.4;
        ctx.shadowColor = shape.color;
        ctx.shadowBlur = 12;

        for (const [idxA, idxB] of shape.edges) {
          const pA = projectedVertices[idxA];
          const pB = projectedVertices[idxB];
          if (pA && pB) {
            ctx.beginPath();
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();
          }
        }

        // Draw glowing vertex nodes
        for (const pv of projectedVertices) {
          if (pv) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pv.x, pv.y, 2 * pv.scale, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
        canvas.removeEventListener('click', handleClick);
      }
    };
  }, [density, showGrid, interactive, accentColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-auto ${className}`}
      style={{ touchAction: 'none' }}
    />
  );
}
