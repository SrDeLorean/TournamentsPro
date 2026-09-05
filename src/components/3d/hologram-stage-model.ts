export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface HologramSpark {
  angle: number;
  y: number;
  radius: number;
  speed: number;
  size: number;
  color: string;
}

export const CUP_RINGS = [
  { y: -90, r: 50, segments: 16 },
  { y: -70, r: 44, segments: 16 },
  { y: -45, r: 35, segments: 16 },
  { y: -20, r: 24, segments: 12 },
  { y: 0, r: 12, segments: 10 },
  { y: 25, r: 10, segments: 10 },
  { y: 45, r: 18, segments: 12 },
  { y: 65, r: 38, segments: 16 },
  { y: 80, r: 48, segments: 16 },
] as const;

export const ORBITAL_RINGS = [
  { radius: 85, tiltX: 0.6, tiltY: 0.2, color: '#00f0ff' },
  { radius: 110, tiltX: -0.4, tiltY: 0.7, color: '#c084fc' },
  { radius: 135, tiltX: 0.8, tiltY: -0.5, color: '#fbbf24' },
] as const;

export function rotate3D(point: Point3D, rotX: number, rotY: number, rotZ: number): Point3D {
  const y1 = point.y * Math.cos(rotX) - point.z * Math.sin(rotX);
  const z1 = point.y * Math.sin(rotX) + point.z * Math.cos(rotX);
  const x2 = point.x * Math.cos(rotY) + z1 * Math.sin(rotY);
  const z2 = -point.x * Math.sin(rotY) + z1 * Math.cos(rotY);
  return {
    x: x2 * Math.cos(rotZ) - y1 * Math.sin(rotZ),
    y: x2 * Math.sin(rotZ) + y1 * Math.cos(rotZ),
    z: z2,
  };
}

export function project3D(point: Point3D, camDist: number, fov: number, cx: number, cy: number) {
  const zOffset = point.z + camDist;
  if (zOffset <= 1) return null;
  const scale = fov / zOffset;
  return { x: point.x * scale + cx, y: point.y * scale + cy, scale };
}

export function createTrophyHandles() {
  const left: Point3D[] = [];
  const right: Point3D[] = [];
  for (let index = 0; index <= 10; index += 1) {
    const progress = index / 10;
    const x = 42 + Math.sin(progress * Math.PI) * 28;
    const point = { y: -80 + progress * 60, z: 0 };
    right.push({ x, ...point });
    left.push({ x: -x, ...point });
  }
  return { left, right };
}

export function createHologramSparks(count = 28): HologramSpark[] {
  return Array.from({ length: count }, (_, index) => ({
    angle: Math.random() * Math.PI * 2,
    y: (Math.random() - 0.5) * 180,
    radius: 30 + Math.random() * 85,
    speed: (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
    size: Math.random() * 2 + 1,
    color: index % 2 === 0 ? '#00f0ff' : '#c084fc',
  }));
}
