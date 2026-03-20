import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
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
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + index) * 0.015;
    }
  });

  const displayValue = card
    ? card.card_type === "blank" ? "X" : String(card.value)
    : "";
  const isFive = card?.value === 5;

  const bodyColor = faceUp ? "#D4CFC7" : "#B8B2A8";

  return (
    <group ref={groupRef} position={position}>
      {/* Person-shaped card standing upright, facing +Z (toward player) */}
      <group scale={1.5}>
        {/* Body */}
        <mesh castShadow position={[0, 0.7, 0]}>
          <boxGeometry args={[0.65, 1.1, 0.05]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} />
        </mesh>

        {/* Head */}
        <mesh castShadow position={[0, 1.4, 0]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} />
        </mesh>

        {/* Legs (two thin rectangles at the bottom to stand) */}
        <mesh position={[-0.15, 0.05, 0.15]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.08, 0.25, 0.3]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} />
        </mesh>
        <mesh position={[0.15, 0.05, 0.15]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.08, 0.25, 0.3]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} />
        </mesh>

        {/* Number displayed using Html overlay - always visible */}
        {faceUp && (
          <Html
            position={[0, 0.7, 0.03]}
            center
            distanceFactor={4}
            style={{ pointerEvents: "none" }}
          >
            <div style={{
              fontSize: "48px",
              fontWeight: 900,
              color: isFive ? "#E63946" : "#2D2926",
              textAlign: "center",
              lineHeight: 1,
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
              textShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}>
              {displayValue}
            </div>
          </Html>
        )}

        {/* Dots below the number */}
        {faceUp && card?.card_type === "number" && (
          <Html
            position={[0, 0.35, 0.03]}
            center
            distanceFactor={4}
            style={{ pointerEvents: "none" }}
          >
            <div style={{
              display: "flex",
              gap: "3px",
              flexWrap: "wrap",
              justifyContent: "center",
              width: "50px",
            }}>
              {Array.from({ length: Math.min(card.value ?? 0, 8) }).map((_, i) => (
                <div key={i} style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: isFive ? "#E63946" : "#2D2926",
                }} />
              ))}
            </div>
          </Html>
        )}
      </group>

      {/* Murderer glow effect */}
      {isMurderer && (
        <pointLight position={[0, 1, 0.5]} intensity={3} color="#E63946" distance={3} />
      )}
    </group>
  );
}
