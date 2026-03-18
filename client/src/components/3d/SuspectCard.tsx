import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { CardInfo } from "../../types";

interface Props {
  position: [number, number, number];
  index: number;
  faceUp: boolean;
  card: CardInfo | null;
  isMurderer?: boolean;
}

export function SuspectCard({ position, index, faceUp, card, isMurderer = false }: Props) {
  const groupRef = useRef<THREE.Group>(null);

  // Gentle idle sway
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + index) * 0.02;
    }
  });

  const displayValue = card
    ? card.card_type === "blank" ? "X" : String(card.value)
    : "?";

  const isFive = card?.value === 5;

  // Person-shaped card (tall rectangle with rounded head)
  return (
    <group ref={groupRef} position={position}>
      {/* Body (standing upright) */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[0.7, 1.2, 0.06]} />
        <meshStandardMaterial
          color={faceUp ? "#D4CFC7" : "#B8B2A8"}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* Head (circle on top) */}
      <mesh castShadow position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial
          color={faceUp ? "#D4CFC7" : "#B8B2A8"}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* Number on the card body */}
      {faceUp && (
        <Text
          position={[0, 0.6, 0.04]}
          fontSize={0.4}
          color={isFive ? "#E63946" : "#2D2926"}
          anchorX="center"
          anchorY="middle"
        >
          {displayValue}
        </Text>
      )}

      {/* Dots pattern (like the real game) */}
      {faceUp && card?.card_type === "number" && (
        <group position={[0, 0.2, 0.04]}>
          {Array.from({ length: Math.min(card.value ?? 0, 6) }).map((_, i) => (
            <mesh key={i} position={[(i % 2 - 0.5) * 0.15, -Math.floor(i / 2) * 0.12, 0]}>
              <circleGeometry args={[0.035, 12]} />
              <meshStandardMaterial color={isFive ? "#E63946" : "#2D2926"} />
            </mesh>
          ))}
        </group>
      )}

      {/* Murderer glow */}
      {isMurderer && (
        <pointLight position={[0, 0.8, 0.3]} intensity={2} color="#E63946" distance={2} />
      )}

      {/* Card base shadow */}
      <mesh position={[0, 0.01, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.8, 0.15]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}
