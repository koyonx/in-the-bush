import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Table } from "./Table";
import { SuspectCard } from "./SuspectCard";
import { VictimCard } from "./VictimCard";
import { PlayerChips } from "./PlayerChips";
import { AlibiCard } from "./AlibiCard";
import { DiscovererMarker } from "./DiscovererMarker";
import type { GameData } from "../../App";
import type { CardInfo } from "../../types";

interface Props {
  gameData: GameData;
  playerId: string;
  spectatorMode?: boolean;
}

export function TableScene({ gameData, playerId, spectatorMode = false }: Props) {
  const { players, discovererIndex, viewedSuspects, accusationStacks, alibiCards, roundResult, phase } = gameData;
  const myIndex = players.findIndex((p) => p.id === playerId);

  // Suspect card positions (center, slightly spread)
  const suspectPositions: [number, number, number][] = [
    [-1.2, 0.05, -0.3],
    [0, 0.05, -0.3],
    [1.2, 0.05, -0.3],
  ];

  // Player positions around the table
  const getPlayerPositions = (count: number): [number, number, number][] => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      // Arrange in a circle, starting from bottom (self) going clockwise
      const offset = spectatorMode ? 0 : -myIndex;
      const angle = ((i + offset) / count) * Math.PI * 2 - Math.PI / 2;
      const radius = 3.5;
      positions.push([
        Math.cos(angle) * radius,
        0.05,
        Math.sin(angle) * radius,
      ]);
    }
    return positions;
  };

  const playerPositions = getPlayerPositions(players.length);

  // Determine what to show on suspect cards
  const getSuspectDisplay = (idx: number): { faceUp: boolean; card: CardInfo | null } => {
    if (roundResult) {
      return { faceUp: true, card: roundResult.suspects[idx] };
    }
    if (viewedSuspects?.indices.includes(idx)) {
      const cardIdx = viewedSuspects.indices.indexOf(idx);
      return { faceUp: true, card: viewedSuspects.cards[cardIdx] };
    }
    return { faceUp: false, card: null };
  };

  // Camera position - closer and more angled to see the table properly
  const cameraPosition: [number, number, number] = spectatorMode
    ? [0, 10, 0.1] // Top-down for spectator
    : [0, 6, 5]; // Angled view for player - closer to table

  return (
    <Canvas
      camera={{ position: cameraPosition, fov: 60 }}
      shadows
      style={{ background: "#1a0a0a", width: "100%", height: "100%" }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, 4, 0]} intensity={0.6} color="#fff5e0" />

      {/* Table */}
      <Table />

      {/* Suspect Cards (center) */}
      {suspectPositions.map((pos, i) => {
        const { faceUp, card } = getSuspectDisplay(i);
        return (
          <SuspectCard
            key={i}
            position={pos}
            index={i}
            faceUp={faceUp}
            card={card}
            isMurderer={roundResult?.murdererIdx === i}
          />
        );
      })}

      {/* Victim Card */}
      <VictimCard
        position={[0, 0.02, 0.8]}
        card={roundResult?.victim ?? null}
        faceUp={!!roundResult}
      />

      {/* Discoverer Marker */}
      <DiscovererMarker position={[0, 0.05, -1.5]} />

      {/* Player Areas with Chips */}
      {players.map((player, i) => (
        <PlayerChips
          key={player.id}
          position={playerPositions[i]}
          playerName={player.name}
          playerIndex={i}
          isCurrentPlayer={i === myIndex}
          isDiscoverer={i === discovererIndex}
          accusationStacks={accusationStacks}
          chipColor={getPlayerColor(i)}
        />
      ))}

      {/* Alibi Card (player's hand area) */}
      {alibiCards && phase !== "round_end" && phase !== "game_over" && (
        <AlibiCard
          position={[0, 0.1, 3.2]}
          ownCard={alibiCards.own}
          receivedCard={alibiCards.received}
          phase={phase}
        />
      )}

      {/* Controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={spectatorMode}
        enableRotate={spectatorMode}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
      />
    </Canvas>
  );
}

function getPlayerColor(index: number): string {
  const colors = [
    "#FF6B35", "#00B4A6", "#457B9D", "#E63946",
    "#FFB800", "#9B59B6", "#2ECC71", "#E67E22",
    "#1ABC9C", "#E74C3C",
  ];
  return colors[index % colors.length];
}
