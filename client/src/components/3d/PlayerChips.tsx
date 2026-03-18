import { Text } from "@react-three/drei";

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
  // Count how many accusations this player made (across all stacks)
  const chipCount = accusationStacks.reduce(
    (acc, stack) => acc + stack.filter((name) => name === playerName).length,
    0
  );

  // Scatter chips around the player area
  const chipPositions: [number, number, number][] = [];
  for (let i = 0; i < Math.min(chipCount + 2, 5); i++) {
    const angle = (i / 5) * Math.PI * 2 + playerIndex * 0.5;
    const r = 0.3 + Math.random() * 0.3;
    chipPositions.push([Math.cos(angle) * r, 0, Math.sin(angle) * r]);
  }

  return (
    <group position={position}>
      {/* Player name plate */}
      <group position={[0, 0, 0]}>
        {/* Background plate */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[1.2, 0.4]} />
          <meshStandardMaterial
            color={isCurrentPlayer ? chipColor : "#D4CFC7"}
            roughness={0.6}
            transparent
            opacity={0.8}
          />
        </mesh>
        <Text
          position={[0, 0.03, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.15}
          color={isCurrentPlayer ? "#FFFFFF" : "#2D2926"}
          anchorX="center"
          anchorY="middle"
          maxWidth={1}
        >
          {playerName}
        </Text>
      </group>

      {/* Accusation chips (mustache-style round chips) */}
      {chipPositions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh castShadow position={[0, 0.04 + i * 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.03, 16]} />
            <meshStandardMaterial
              color={chipColor}
              roughness={0.3}
              metalness={0.1}
            />
          </mesh>
          {/* Chip symbol (mustache-like curve) */}
          <mesh position={[0, 0.06 + i * 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.04, 0.015, 8, 12, Math.PI]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
      ))}

      {/* Discoverer indicator */}
      {isDiscoverer && (
        <group position={[0.6, 0, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <circleGeometry args={[0.15, 16]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
          </mesh>
          <Text
            position={[0, 0.04, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.12}
            color="#2D2926"
            anchorX="center"
            anchorY="middle"
          >
            &#128269;
          </Text>
        </group>
      )}
    </group>
  );
}
