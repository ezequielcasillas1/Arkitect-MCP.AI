import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges, Float, PerspectiveCamera } from "@react-three/drei";
import type { Group } from "three";

const ACCENT = "#6d8cff";
const ACCENT_SOFT = "#a9c0ff";
const SURFACE = "#1a2238";

function Beam({
  position,
  args,
  rotation
}: {
  position: [number, number, number];
  args: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={ACCENT} metalness={0.75} roughness={0.25} emissive={ACCENT} emissiveIntensity={0.08} />
      <Edges color={ACCENT_SOFT} threshold={15} />
    </mesh>
  );
}

function ArchStructure() {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef}>
      <Beam position={[-0.75, 0.1, 0]} args={[0.22, 2.4, 0.22]} />
      <Beam position={[0.75, 0.1, 0]} args={[0.22, 2.4, 0.22]} />
      <Beam position={[0, 0.85, 0]} args={[1.55, 0.18, 0.18]} rotation={[0, 0, -0.52]} />
      <Beam position={[0, -0.15, 0]} args={[1.55, 0.18, 0.18]} rotation={[0, 0, 0.52]} />
      <mesh position={[0, -1.35, 0]}>
        <boxGeometry args={[2.1, 0.14, 1.1]} />
        <meshStandardMaterial color={SURFACE} metalness={0.6} roughness={0.35} />
        <Edges color={ACCENT_SOFT} threshold={15} />
      </mesh>

      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.35}>
        <mesh position={[-1.35, 0.6, 0.35]}>
          <boxGeometry args={[0.35, 0.35, 0.35]} />
          <meshStandardMaterial color={ACCENT} wireframe />
        </mesh>
      </Float>
      <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.4}>
        <mesh position={[1.3, -0.4, -0.3]}>
          <boxGeometry args={[0.28, 0.55, 0.28]} />
          <meshStandardMaterial color={ACCENT_SOFT} metalness={0.9} roughness={0.1} />
          <Edges color={ACCENT} />
        </mesh>
      </Float>
      <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.25}>
        <mesh position={[0.9, 1.1, -0.45]}>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.25} />
        </mesh>
      </Float>
    </group>
  );
}

function LogoScene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.2, 5.2]} fov={42} />
      <ambientLight intensity={0.45} />
      <pointLight position={[4, 4, 4]} intensity={1.2} color={ACCENT_SOFT} />
      <pointLight position={[-3, -2, 2]} intensity={0.5} color="#4a5f9e" />
      <ArchStructure />
    </>
  );
}

export function ArkitectLogo3D() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="hero-logo-placeholder" aria-hidden="true" />;
  }

  return (
    <div className="hero-logo-canvas" role="img" aria-label="Arkitect 3D architectural logo">
      <Suspense fallback={<div className="hero-logo-placeholder" aria-hidden="true" />}>
        <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
          <LogoScene />
        </Canvas>
      </Suspense>
    </div>
  );
}
