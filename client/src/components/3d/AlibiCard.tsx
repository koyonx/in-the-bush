import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { CardInfo } from "../../types";

interface Props {
  position: [number, number, number];
  ownCard: CardInfo;
  receivedCard: CardInfo | null;
  phase: string;
}

function CardMesh({ card, label, offsetX }: { card: CardInfo; label: string; offsetX: number }) {
  const isFive = card.value === 5;
  const display = card.card_type === "blank" ? "X" : String(card.value);

  return (
    <group position={[offsetX, 0, 0]}>
      {/* Card body - tilted toward player */}
      <mesh castShadow rotation={[-0.6, 0, 0]}>
        <boxGeometry args={[0.9, 1.2, 0.04]} />
        <meshStandardMaterial color="#F5F0E1" roughness={0.5} />
      </mesh>

      {/* Card content via Html */}
      <Html
        position={[0, 0.15, 0.45]}
        center
        distanceFactor={5}
        style={{ pointerEvents: "none" }}
      >
        <div style={{
          textAlign: "center",
          fontFamily: "'M PLUS Rounded 1c', sans-serif",
        }}>
          <div style={{
            fontSize: "56px",
            fontWeight: 900,
            color: isFive ? "#E63946" : "#2D2926",
            lineHeight: 1,
          }}>
            {display}
          </div>
          <div style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "#8D8680",
            marginTop: "4px",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}>
            {label}
          </div>
        </div>
      </Html>
    </group>
  );
}

export function AlibiCard({ position, ownCard, receivedCard, phase }: Props) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.03;
    }
  });

  const hasReceived = receivedCard !== null;
  const ownX = hasReceived ? -0.6 : 0;
  const recX = 0.6;

  return (
    <group ref={groupRef} position={position} scale={1.3}>
      <CardMesh card={ownCard} label="Your Alibi" offsetX={ownX} />
      {receivedCard && (
        <CardMesh card={receivedCard} label="From Right" offsetX={recX} />
      )}
    </group>
  );
}
