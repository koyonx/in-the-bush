import { useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Table } from "./Table";
import { SuspectCard } from "./SuspectCard";
import { VictimCard } from "./VictimCard";
import { PlayerChips } from "./PlayerChips";
import type { GameData } from "../../App";
import type { CardInfo } from "../../types";
import * as THREE from "three";

interface Props {
  gameData: GameData;
  playerId: string;
}

function CameraController() {
  const { camera } = useThree();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      // 斜め上から全体を見下ろす自然な角度
      camera.position.set(0, 5, 5.5);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
      camera.updateProjectionMatrix();
      initialized.current = true;
    }
  }, [camera]);

  return null;
}

export function TableScene({ gameData, playerId }: Props) {
  const { players, discovererIndex, viewedSuspects, accusationStacks, roundResult } = gameData;
  const myIndex = players.findIndex((p) => p.id === playerId);

  const suspectPositions: [number, number, number][] = [
    [-1.2, 0, -0.3],
    [0, 0, -0.3],
    [1.2, 0, -0.3],
  ];

  const getPlayerPositions = (count: number): [number, number, number][] => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      const offset = -myIndex;
      const angle = ((i + offset) / count) * Math.PI * 2 + Math.PI / 2;
      const radius = 2.5;
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
      camera={{ fov: 55 }}
      shadows
      style={{ background: "#15100c", width: "100%", height: "100%" }}
    >
      <CameraController />

      <ambientLight intensity={2.0} color="#fff5e8" />
      <hemisphereLight args={["#fff0d0", "#3a2a18", 1.2]} />
      <directionalLight position={[0, 8, 4]} intensity={1.5} color="#ffffff" castShadow />
      <directionalLight position={[0, 6, -5]} intensity={0.8} color="#ffe8c8" />
      <pointLight position={[0, 4, 0]} intensity={1.5} color="#fff0d0" distance={15} />

      <Table />

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

      <VictimCard
        position={[0, 0.02, 1.0]}
        card={roundResult?.victim ?? null}
        faceUp={!!roundResult}
      />

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
    </Canvas>
  );
}

function getPlayerColor(index: number): string {
  const colors = [
    "#C41E3A", "#C9A96E", "#4A7A9B", "#5B7553",
    "#8B4513", "#7B5EA7", "#B87333", "#2E4F6E",
    "#D94F5C", "#DFC48B",
  ];
  return colors[index % colors.length];
}
