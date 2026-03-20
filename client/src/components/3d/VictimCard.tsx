import { Html } from "@react-three/drei";
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
    <group position={position} scale={1.2}>
      {/* Laying flat on table */}
      <mesh castShadow rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[1.2, 0.7, 0.04]} />
        <meshStandardMaterial
          color={faceUp ? "#D4CFC7" : "#B8B2A8"}
          roughness={0.6}
        />
      </mesh>

      {faceUp && (
        <Html
          position={[0, 0.05, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          center
          distanceFactor={6}
          style={{ pointerEvents: "none" }}
          transform
        >
          <div style={{
            textAlign: "center",
            fontFamily: "'M PLUS Rounded 1c', sans-serif",
          }}>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#2D2926" }}>
              {displayValue}
            </div>
            <div style={{ fontSize: "8px", fontWeight: 700, color: "#8D8680", letterSpacing: "2px" }}>
              VICTIM
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
