import { Html } from "@react-three/drei";
import type { CardInfo } from "../../types";

interface Props {
  position: [number, number, number];
  card: CardInfo | null;
  faceUp: boolean;
}

export function VictimCard({ position, card, faceUp }: Props) {
  const displayValue = card
    ? card.card_type === "blank" ? "×" : String(card.value)
    : "";

  return (
    <group position={position} scale={1.0}>
      <mesh castShadow rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[1.0, 0.65, 0.03]} />
        <meshStandardMaterial
          color={faceUp ? "#F0EBE0" : "#E8E0D0"}
          emissive="#6B6050"
          emissiveIntensity={0.4}
          roughness={0.5}
        />
      </mesh>

      {!faceUp && (
        <Html
          position={[0, 0.04, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          center distanceFactor={6}
          style={{ pointerEvents: "none" }}
          transform
        >
          <div style={{
            fontSize: "16px", fontWeight: 700,
            color: "#5C3D2E", letterSpacing: "4px",
            fontFamily: "'Zen Antique', 'Noto Serif JP', serif",
          }}>
            被害者
          </div>
        </Html>
      )}

      {faceUp && (
        <Html
          position={[0, 0.04, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          center distanceFactor={6}
          style={{ pointerEvents: "none" }}
          transform
        >
          <div style={{ textAlign: "center", fontFamily: "'Zen Antique', 'Noto Serif JP', serif" }}>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "#1a1a1a" }}>
              {displayValue}
            </div>
            <div style={{ fontSize: "7px", fontWeight: 700, color: "#5C3D2E", letterSpacing: "3px" }}>
              被害者
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
