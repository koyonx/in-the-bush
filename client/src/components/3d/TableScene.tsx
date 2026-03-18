import { useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Table } from "./Table";
import { SuspectCard } from "./SuspectCard";
import { VictimCard } from "./VictimCard";
import { PlayerChips } from "./PlayerChips";
import { AlibiCard } from "./AlibiCard";
import { DiscovererMarker } from "./DiscovererMarker";
import type { GameData } from "../../App";
import type { CardInfo } from "../../types";
import * as THREE from "three";

interface Props {
  gameData: GameData;
  playerId: string;
  spectatorMode?: boolean;
}

/** Camera controller that looks at the table center */
function CameraController({ spectatorMode }: { spectatorMode: boolean }) {
  const { camera } = useThree();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      if (spectatorMode) {
        camera.position.set(0, 10, 5);
      } else {
        // ~45 degree angle from player side, looking slightly above table
        camera.position.set(0, 5, 6);
      }
      // Look slightly above table center to frame standing cards
      camera.lookAt(new THREE.Vector3(0, 0.5, 0));
      camera.updateProjectionMatrix();
      initialized.current = true;
    }
  }, [camera, spectatorMode]);

  return null;
}

export function TableScene({ gameData, playerId, spectatorMode = false }: Props) {
  const { players, discovererIndex, viewedSuspects, accusationStacks, alibiCards, roundResult, phase } = gameData;
  const myIndex = players.findIndex((p) => p.id === playerId);

  // Suspect card positions (center, slightly spread, scaled up)
  const suspectPositions: [number, number, number][] = [
    [-1.5, 0.05, -0.3],
    [0, 0.05, -0.3],
    [1.5, 0.05, -0.3],
  ];

  // Player positions around the table (excluding self)
  const getPlayerPositions = (count: number): [number, number, number][] => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      const offset = spectatorMode ? 0 : -myIndex;
      // Start from bottom-center, go clockwise
      const angle = ((i + offset) / count) * Math.PI * 2 + Math.PI / 2;
      const radius = 3.2;
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

  return (
    <Canvas
      camera={{ fov: 55 }}
      shadows
      style={{ background: "#1a0a0a", width: "100%", height: "100%" }}
    >
      <CameraController spectatorMode={spectatorMode} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[3, 10, 5]}
        intensity={0.7}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#fff5e0" />
      {/* Warm fill from player side to illuminate card faces */}
      <pointLight position={[0, 2, 5]} intensity={0.4} color="#ffe0c0" />

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
        position={[0, 0.02, 1.2]}
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

      {/* Alibi Card (player's hand area - in front, near bottom of view) */}
      {alibiCards && phase !== "round_end" && phase !== "game_over" && (
        <AlibiCard
          position={[0, 0.1, 3.0]}
          ownCard={alibiCards.own}
          receivedCard={alibiCards.received}
          phase={phase}
        />
      )}
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
