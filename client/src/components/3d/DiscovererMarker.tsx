import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  position: [number, number, number];
}

export function DiscovererMarker({ position }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <group position={position}>
      {/* Eye icon marker - white card with eye symbol */}
      <mesh ref={meshRef} castShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.04]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
      </mesh>
      {/* Simple eye shape */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.1, 16]} />
        <meshStandardMaterial color="#2D2926" />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    </group>
  );
}
