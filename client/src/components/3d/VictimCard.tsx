import { Text } from "@react-three/drei";
import type { CardInfo } from "../../types";

interface Props {
  position: [number, number, number];
  card: CardInfo | null;
  faceUp: boolean;
}

export function VictimCard({ position, card, faceUp }: Props) {
  const displayValue = card
    ? card.card_type === "blank" ? "X" : String(card.value)
    : "";

  return (
    <group position={position}>
      {/* Laying flat on table */}
      <mesh castShadow rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[1.0, 0.6, 0.04]} />
        <meshStandardMaterial
          color={faceUp ? "#D4CFC7" : "#B8B2A8"}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* Value text */}
      {faceUp && (
        <Text
          position={[0, 0.03, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.25}
          color="#2D2926"
          anchorX="center"
          anchorY="middle"
        >
          {displayValue}
        </Text>
      )}

      {/* "VICTIM" label when face up */}
      {faceUp && (
        <Text
          position={[0, 0.03, 0.18]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.08}
          color="#8D8680"
          anchorX="center"
          anchorY="middle"
        >
          VICTIM
        </Text>
      )}
    </group>
  );
}
