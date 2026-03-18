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
  playerIndex,
  isCurrentPlayer,
  isDiscoverer,
  accusationStacks,
  chipColor,
}: Props) {
  // Count chips placed by this player
  const chipsPlaced = accusationStacks.reduce(
    (acc, stack) => acc + stack.filter((name) => name === playerName).length,
    0
  );

  // Generate scattered chip positions
  const chipPositions: [number, number, number][] = [];
  for (let i = 0; i < Math.min(chipsPlaced + 2, 5); i++) {
    const angle = (i / 5) * Math.PI * 2 + playerIndex * 1.2;
    const r = 0.25 + (i * 0.12);
    chipPositions.push([Math.cos(angle) * r, 0, Math.sin(angle) * r]);
  }

  return (
    <group position={position}>
      {/* Player name label */}
      <Html
        position={[0, 0.3, 0]}
        center
        distanceFactor={8}
        style={{ pointerEvents: "none" }}
      >
        <div style={{
          padding: "3px 10px",
          borderRadius: "8px",
          backgroundColor: isCurrentPlayer ? chipColor : "rgba(212,207,199,0.9)",
          color: isCurrentPlayer ? "#fff" : "#2D2926",
          fontSize: "12px",
          fontWeight: 800,
          fontFamily: "'M PLUS Rounded 1c', sans-serif",
          whiteSpace: "nowrap",
          border: isDiscoverer ? "2px solid #FFB800" : "none",
        }}>
          {playerName} {isDiscoverer ? "👁" : ""}
        </div>
      </Html>

      {/* Accusation chips scattered around */}
      {chipPositions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh castShadow position={[0, 0.04 + i * 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.025, 16]} />
            <meshStandardMaterial color={chipColor} roughness={0.3} metalness={0.1} />
          </mesh>
          {/* Mustache-like mark on chip */}
          <mesh position={[0, 0.055 + i * 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.045, 0.012, 8, 12, Math.PI]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
