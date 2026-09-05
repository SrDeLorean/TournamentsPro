'use client';

import React, { useEffect, useRef } from 'react';
import {
  CUP_RINGS,
  ORBITAL_RINGS,
  createHologramSparks,
  createTrophyHandles,
  project3D,
  rotate3D,
  type Point3D,
} from './hologram-stage-model';

interface HologramStage3DProps {
  className?: string;
  glowColor?: string;
  accentColor?: string;
  size?: number;
}

export function HologramStage3D({
  className = '',
  glowColor = '#00f0ff',
  accentColor = '#c084fc',
  size = 360,
}: HologramStage3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio || size);
    const height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio || size);

    const mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      mouse.targetX = (x / rect.width) * 0.8;
      mouse.targetY = -(y / rect.height) * 0.8;
    };

    const handleMouseLeave = () => {
      mouse.targetX = 0;
      mouse.targetY = 0;
    };

    canvas.addEventListener('pointermove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    const { left: handleLeft, right: handleRight } = createTrophyHandles();
    const sparks = createHologramSparks();

    let time = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;
    let isVisible = true;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const render = () => {
      time += 0.02;

      currentTiltX += (mouse.targetY - currentTiltX) * 0.08;
      currentTiltY += (mouse.targetX - currentTiltY) * 0.08;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const fov = 340 * (width / 360);
      const camDist = 380;

      const baseRotX = 0.15 + currentTiltX;
      const baseRotY = time * 0.4 + currentTiltY;

      // 1. Draw Pedestal Hologram Laser Disc on Floor
      const discY = 100;
      ctx.save();
      const discGrad = ctx.createRadialGradient(cx, cy + discY * (fov / camDist), 5, cx, cy + discY * (fov / camDist), 110);
      discGrad.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
      discGrad.addColorStop(0.5, 'rgba(192, 132, 252, 0.15)');
      discGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy + discY * (fov / camDist), 120, 36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Draw Trophy Wireframe Rings
      ctx.save();
      ctx.lineWidth = 1.3 * (width / 360);
      ctx.strokeStyle = glowColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10;

      const projectedRingPoints: { x: number; y: number }[][] = [];

      for (let rIdx = 0; rIdx < CUP_RINGS.length; rIdx++) {
        const ring = CUP_RINGS[rIdx];
        const ringPoints: { x: number; y: number }[] = [];

        ctx.beginPath();
        for (let s = 0; s <= ring.segments; s++) {
          const angle = (s / ring.segments) * Math.PI * 2;
          const p: Point3D = {
            x: Math.cos(angle) * ring.r,
            y: ring.y,
            z: Math.sin(angle) * ring.r,
          };
          const rot = rotate3D(p, baseRotX, baseRotY, 0);
          const proj = project3D(rot, camDist, fov, cx, cy);
          if (proj) {
            ringPoints.push({ x: proj.x, y: proj.y });
            if (s === 0) ctx.moveTo(proj.x, proj.y);
            else ctx.lineTo(proj.x, proj.y);
          }
        }
        ctx.stroke();
        projectedRingPoints.push(ringPoints);
      }

      // Vertical ribs along the trophy body
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      const ribCount = 8;
      for (let rib = 0; rib < ribCount; rib++) {
        ctx.beginPath();
        for (let rIdx = 0; rIdx < CUP_RINGS.length; rIdx++) {
          const ring = CUP_RINGS[rIdx];
          const angle = (rib / ribCount) * Math.PI * 2;
          const p: Point3D = {
            x: Math.cos(angle) * ring.r,
            y: ring.y,
            z: Math.sin(angle) * ring.r,
          };
          const rot = rotate3D(p, baseRotX, baseRotY, 0);
          const proj = project3D(rot, camDist, fov, cx, cy);
          if (proj) {
            if (rIdx === 0) ctx.moveTo(proj.x, proj.y);
            else ctx.lineTo(proj.x, proj.y);
          }
        }
        ctx.stroke();
      }

      // Draw Trophy Handles
      const drawHandle = (points: Point3D[]) => {
        ctx.beginPath();
        ctx.strokeStyle = accentColor;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2 * (width / 360);

        for (let i = 0; i < points.length; i++) {
          const rot = rotate3D(points[i], baseRotX, baseRotY, 0);
          const proj = project3D(rot, camDist, fov, cx, cy);
          if (proj) {
            if (i === 0) ctx.moveTo(proj.x, proj.y);
            else ctx.lineTo(proj.x, proj.y);
          }
        }
        ctx.stroke();
      };
      drawHandle(handleLeft);
      drawHandle(handleRight);

      ctx.restore();

      // 3. Draw 3D Orbital League Rings
      for (let i = 0; i < ORBITAL_RINGS.length; i++) {
        const ring = ORBITAL_RINGS[i];
        const ringAngle = time * (i % 2 === 0 ? 1 : -1) * 0.8;

        ctx.save();
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 1.6 * (width / 360);
        ctx.shadowColor = ring.color;
        ctx.shadowBlur = 14;

        ctx.beginPath();
        const segments = 32;
        for (let s = 0; s <= segments; s++) {
          const a = (s / segments) * Math.PI * 2;
          const p: Point3D = {
            x: Math.cos(a) * ring.radius,
            y: Math.sin(a) * ring.radius * 0.35,
            z: Math.sin(a) * ring.radius,
          };
          // Apply individual orbital tilt
          const tilted = rotate3D(p, ring.tiltX, ring.tiltY + ringAngle, 0);
          const camRot = rotate3D(tilted, baseRotX, baseRotY, 0);
          const proj = project3D(camRot, camDist, fov, cx, cy);

          if (proj) {
            if (s === 0) {
              ctx.moveTo(proj.x, proj.y);
            } else {
              ctx.lineTo(proj.x, proj.y);
            }
          }
        }
        ctx.stroke();

        // Orbiting Satellite Crystal on this ring
        const satAngle = time * 2.2 + i * (Math.PI / 1.5);
        const satP: Point3D = {
          x: Math.cos(satAngle) * ring.radius,
          y: Math.sin(satAngle) * ring.radius * 0.35,
          z: Math.sin(satAngle) * ring.radius,
        };
        const satTilted = rotate3D(satP, ring.tiltX, ring.tiltY + ringAngle, 0);
        const satRot = rotate3D(satTilted, baseRotX, baseRotY, 0);
        const satProj = project3D(satRot, camDist, fov, cx, cy);

        if (satProj) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(satProj.x, satProj.y, 3 * satProj.scale, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // 4. Draw Floating Sparkle Nodes
      for (const spark of sparks) {
        spark.angle += spark.speed;
        const sp: Point3D = {
          x: Math.cos(spark.angle) * spark.radius,
          y: spark.y + Math.sin(time * 2 + spark.angle) * 8,
          z: Math.sin(spark.angle) * spark.radius,
        };
        const rot = rotate3D(sp, baseRotX, baseRotY, 0);
        const proj = project3D(rot, camDist, fov, cx, cy);

        if (proj) {
          ctx.save();
          ctx.fillStyle = spark.color;
          ctx.shadowColor = spark.color;
          ctx.shadowBlur = 8;
          ctx.globalAlpha = Math.sin(time * 3 + spark.angle) * 0.4 + 0.6;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, spark.size * proj.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      if (!reducedMotion.matches && isVisible && !document.hidden) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const restart = () => {
      cancelAnimationFrame(animationFrameId);
      if (isVisible && !document.hidden) render();
    };
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      restart();
    }, { rootMargin: '120px' });
    const handleVisibilityChange = () => restart();
    observer.observe(canvas);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      canvas.removeEventListener('pointermove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [glowColor, accentColor, size]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain pointer-events-auto"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
