import { Html } from "@react-three/drei";

interface Props {
  position: [number, number, number];
  playerName: string;
  playerIndex: number;
  isCurrentPlayer: boolean;
  isDiscoverer: boolean;
  accusationStacks: string[][];
  chipColor: string;
}

export function PlayerChips({
  position,
  playerName,
  isCurrentPlayer,
  isDiscoverer,
  accusationStacks,
  chipColor,
}: Props) {
  // このプレイヤーが実際に告発したチップ数のみ表示
  const chipsPlaced = accusationStacks.reduce(
    (acc, stack) => acc + stack.filter((name) => name === playerName).length,
    0
  );

  return (
    <group position={position}>
      {/* プレイヤー名ラベル */}
      <Html
        position={[0, 0.4, 0]}
        center
        distanceFactor={8}
        style={{ pointerEvents: "none" }}
      >
        <div style={{
          padding: "4px 14px",
          background: isCurrentPlayer ? chipColor : "rgba(60,50,40,0.95)",
          color: isCurrentPlayer ? "#F5F0E1" : "#DFC48B",
          fontSize: "13px",
          fontWeight: 700,
          fontFamily: "'Noto Serif JP', serif",
          whiteSpace: "nowrap",
          border: isDiscoverer ? "2px solid #C9A96E" : "1px solid rgba(201,169,110,0.4)",
          letterSpacing: "2px",
        }}>
          {playerName}
          {isDiscoverer && (
            <span style={{ color: "#DFC48B", marginLeft: "6px", fontSize: "10px" }}>発見者</span>
          )}
        </div>
      </Html>

      {/* 告発チップ - 実際に置いた分だけ表示 */}
      {Array.from({ length: chipsPlaced }).map((_, i) => {
        const angle = (i / Math.max(chipsPlaced, 1)) * Math.PI * 2;
        const r = 0.2;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        return (
          <mesh
            key={i}
            castShadow
            position={[x, 0.03 + i * 0.015, z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.08, 0.08, 0.018, 16]} />
            <meshStandardMaterial
              color={chipColor}
              emissive={chipColor}
              emissiveIntensity={0.3}
              roughness={0.2}
              metalness={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}
