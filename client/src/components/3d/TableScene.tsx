import { useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Table } from "./Table";
import { SuspectCard } from "./SuspectCard";
import { VictimCard } from "./VictimCard";
import { PlayerChips } from "./PlayerChips";
import { AlibiCard } from "./AlibiCard";
import type { GameData } from "../../App";
import type { CardInfo } from "../../types";
import * as THREE from "three";

interface Props {
  gameData: GameData;
  playerId: string;
  spectatorMode?: boolean;
}

function CameraController({ spectatorMode }: { spectatorMode: boolean }) {
  const { camera } = useThree();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      if (spectatorMode) {
        camera.position.set(0, 8, 6);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
      } else {
        // Low angle, looking at the cards from across the table
        // Y=3 (not too high), Z=7 (far back to see the full table)
        camera.position.set(0, 3, 7);
        camera.lookAt(new THREE.Vector3(0, 0.8, 0));
      }
      camera.updateProjectionMatrix();
      initialized.current = true;
    }
  }, [camera, spectatorMode]);

  return null;
}

export function TableScene({ gameData, playerId, spectatorMode = false }: Props) {
  const { players, discovererIndex, viewedSuspects, accusationStacks, alibiCards, roundResult, phase } = gameData;
  const myIndex = players.findIndex((p) => p.id === playerId);

  // Suspect card positions - center of table, spread horizontally
  const suspectPositions: [number, number, number][] = [
    [-1.8, 0, 0],
    [0, 0, 0],
    [1.8, 0, 0],
  ];

  // Player positions around the table
  const getPlayerPositions = (count: number): [number, number, number][] => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      const offset = spectatorMode ? 0 : -myIndex;
      const angle = ((i + offset) / count) * Math.PI * 2 + Math.PI / 2;
      const radius = 3.5;
      positions.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
    }
    return positions;
  };

  const playerPositions = getPlayerPositions(players.length);

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
      camera={{ fov: 50 }}
      shadows
      style={{ background: "#1a0a0a", width: "100%", height: "100%" }}
    >
      <CameraController spectatorMode={spectatorMode} />

      {/* Lighting - bright enough to see everything */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 8]} intensity={0.8} castShadow />
      {/* Key light from player's side to illuminate card faces */}
      <pointLight position={[0, 3, 8]} intensity={1.0} color="#ffffff" />
      <pointLight position={[0, 5, 0]} intensity={0.4} color="#fff5e0" />

      <Table />

      {/* Suspect Cards - standing in center, facing the player */}
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

      {/* Victim Card - laying flat in front of suspects */}
      <VictimCard
        position={[0, 0.02, 1.8]}
        card={roundResult?.victim ?? null}
        faceUp={!!roundResult}
      />

      {/* Player Areas */}
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

      {/* Alibi Cards - in player's hand area */}
      {alibiCards && phase !== "round_end" && phase !== "game_over" && (
        <AlibiCard
          position={[0, 0.3, 5]}
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
