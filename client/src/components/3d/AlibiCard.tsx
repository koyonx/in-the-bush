import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { CardInfo } from "../../types";

interface Props {
  position: [number, number, number];
  ownCard: CardInfo;
  receivedCard: CardInfo | null;
  phase: string;
}

export function AlibiCard({ position, ownCard, receivedCard, phase }: Props) {
  const groupRef = useRef<THREE.Group>(null);

  // Subtle hover animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });

  const formatValue = (card: CardInfo) =>
    card.card_type === "blank" ? "X" : String(card.value);

  return (
    <group ref={groupRef} position={position} scale={1.4}>
      {/* Own alibi card */}
      <group position={[-0.5, 0, 0]}>
        <mesh castShadow rotation={[-Math.PI / 4, 0, 0]}>
          <boxGeometry args={[0.6, 0.8, 0.03]} />
          <meshStandardMaterial color="#F5F0E1" roughness={0.6} />
        </mesh>
        <Text
          position={[0, 0.05, 0.27]}
          rotation={[-Math.PI / 4, 0, 0]}
          fontSize={0.25}
          color={ownCard.value === 5 ? "#E63946" : "#2D2926"}
          anchorX="center"
          anchorY="middle"
          depthOffset={-1}
        >
          {formatValue(ownCard)}
        </Text>
        <Text
          position={[0, -0.2, 0.44]}
          rotation={[-Math.PI / 4, 0, 0]}
          fontSize={0.07}
          color="#8D8680"
          anchorX="center"
          anchorY="middle"
          depthOffset={-1}
        >
          YOUR ALIBI
        </Text>
      </group>

      {/* Received alibi card (from right neighbor) */}
      {receivedCard && (
        <group position={[0.5, 0, 0]}>
          <mesh castShadow rotation={[-Math.PI / 4, 0, 0.05]}>
            <boxGeometry args={[0.6, 0.8, 0.03]} />
            <meshStandardMaterial color="#F5F0E1" roughness={0.6} />
          </mesh>
          <Text
            position={[0, 0.05, 0.27]}
            rotation={[-Math.PI / 4, 0, 0.05]}
            fontSize={0.25}
            color={receivedCard.value === 5 ? "#E63946" : "#2D2926"}
            anchorX="center"
            anchorY="middle"
            depthOffset={-1}
          >
            {formatValue(receivedCard)}
          </Text>
          <Text
            position={[0, -0.2, 0.44]}
            rotation={[-Math.PI / 4, 0, 0.05]}
            fontSize={0.07}
            color="#8D8680"
            anchorX="center"
            anchorY="middle"
            depthOffset={-1}
          >
            FROM RIGHT
          </Text>
        </group>
      )}
    </group>
  );
}
