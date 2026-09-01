'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  glareEffect?: boolean;
  maxTilt?: number;
  neonBorder?: boolean;
  accentColor?: string;
}

export function Card3D({
  children,
  className = '',
  glareEffect = true,
  maxTilt = 12,
  neonBorder = true,
  accentColor = '#00f0ff',
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Raw cursor coordinates (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring physics for natural weight feel
  const springConfig = { damping: 20, stiffness: 220, mass: 0.6 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]), springConfig);

  // Specular Glare position
  const glareX = useSpring(useTransform(x, [-0.5, 0.5], ['0%', '100%']), springConfig);
  const glareY = useSpring(useTransform(y, [-0.5, 0.5], ['0%', '100%']), springConfig);

  // Border highlight angle
  const borderAngle = useTransform(
    [x, y],
    ([latestX, latestY]: number[]) => {
      const rad = Math.atan2(latestY, latestX);
      return `${(rad * 180) / Math.PI + 90}deg`;
    }
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const normalizedX = mouseX / width - 0.5;
    const normalizedY = mouseY / height - 0.5;

    x.set(normalizedX);
    y.set(normalizedY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div
      style={{ perspective: 1200 }}
      className="w-full relative select-none"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          scale: isHovered ? 1.015 : 1,
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`relative rounded-3xl transition-shadow duration-300 ${
          isHovered
            ? 'shadow-[0_25px_60px_-15px_rgba(0,240,255,0.2),0_0_35px_rgba(192,132,252,0.15)]'
            : 'shadow-[0_15px_40px_-15px_rgba(0,0,0,0.8)]'
        } ${className}`}
      >
        {/* Dynamic 3D Neon Border Glow */}
        {neonBorder && (
          <motion.div
            className="absolute -inset-[1px] rounded-3xl pointer-events-none opacity-0 transition-opacity duration-300 z-0"
            animate={{ opacity: isHovered ? 1 : 0.25 }}
            style={{
              background: `linear-gradient(${borderAngle}, #00f0ff 0%, #c084fc 45%, #fbbf24 85%, transparent 100%)`,
            }}
          />
        )}

        {/* Card Content Container */}
        <div
          className="relative z-10 w-full h-full rounded-3xl overflow-hidden bg-slate-950/85 backdrop-blur-xl border border-white/10"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {children}

          {/* 3D Specular Holographic Glare Layer */}
          {glareEffect && isHovered && (
            <motion.div
              className="absolute inset-0 pointer-events-none z-30 mix-blend-overlay opacity-60 rounded-3xl"
              style={{
                background: `radial-gradient(circle 320px at ${glareX} ${glareY}, rgba(255,255,255,0.45), rgba(0,240,255,0.2) 35%, transparent 70%)`,
              }}
            />
          )}

          {/* Cyber Scanline Overlay */}
          <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />
        </div>
      </motion.div>
    </div>
  );
}

export function Card3DItem({
  children,
  depth = 25,
  className = '',
}: {
  children: React.ReactNode;
  depth?: number;
  className?: string;
}) {
  return (
    <div
      style={{
        transform: `translateZ(${depth}px)`,
        transformStyle: 'preserve-3d',
      }}
      className={`transition-transform duration-200 ${className}`}
    >
      {children}
    </div>
  );
}
