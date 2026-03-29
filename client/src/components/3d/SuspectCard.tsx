import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { CardInfo } from "../../types";

interface Props {
  position: [number, number, number];
  index: number;
  faceUp: boolean;
  card: CardInfo | null;
  isMurderer?: boolean;
}

const SUSPECT_KANJI = ["壱", "弐", "参"];

export function SuspectCard({ position, index, faceUp, card, isMurderer = false }: Props) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4 + index * 1.5) * 0.008;
    }
  });

  const displayValue = card
    ? card.card_type === "blank" ? "×" : String(card.value)
    : "";
  const isFive = card?.value === 5;

  const bodyColor = faceUp ? "#F0EBE0" : "#E8E0D0";

  return (
    <group ref={groupRef} position={position}>
      {/* カード全体をプレイヤー側に少し傾ける */}
      <group scale={1.5} rotation={[0.15, 0, 0]}>
        {/* 体 - 少し厚みを持たせる */}
        <mesh castShadow position={[0, 0.75, 0]}>
          <boxGeometry args={[0.55, 1.1, 0.06]} />
          <meshStandardMaterial
            color={bodyColor}
            emissive="#6B6050"
            emissiveIntensity={0.4}
            roughness={0.5}
          />
        </mesh>

        {/* 頭 */}
        <mesh castShadow position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial
            color={bodyColor}
            emissive="#6B6050"
            emissiveIntensity={0.4}
            roughness={0.5}
          />
        </mesh>

        {/* 台座 - 立っている感を出す */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.3, 0.04, 16]} />
          <meshStandardMaterial
            color="#8B7355"
            emissive="#4A3D2E"
            emissiveIntensity={0.3}
            roughness={0.4}
          />
        </mesh>

        {/* 漢数字ラベル（裏面） */}
        {!faceUp && (
          <Html position={[0, 0.75, 0.04]} center distanceFactor={4} style={{ pointerEvents: "none" }}>
            <div style={{
              fontSize: "38px",
              fontWeight: 900,
              color: "#5C3D2E",
              textAlign: "center",
              fontFamily: "'Zen Antique', 'Noto Serif JP', serif",
            }}>
              {SUSPECT_KANJI[index]}
            </div>
          </Html>
        )}

        {/* 数字（表面） */}
        {faceUp && (
          <Html position={[0, 0.85, 0.04]} center distanceFactor={4} style={{ pointerEvents: "none" }}>
            <div style={{
              fontSize: "48px",
              fontWeight: 900,
              color: isFive ? "#C41E3A" : "#1a1a1a",
              textAlign: "center",
              fontFamily: "'Zen Antique', 'Noto Serif JP', serif",
            }}>
              {displayValue}
            </div>
          </Html>
        )}

        {/* ドット（表面） */}
        {faceUp && card?.card_type === "number" && (
          <Html position={[0, 0.5, 0.04]} center distanceFactor={4} style={{ pointerEvents: "none" }}>
            <div style={{
              display: "flex", gap: "3px", flexWrap: "wrap",
              justifyContent: "center", width: "44px",
            }}>
              {Array.from({ length: Math.min(card.value ?? 0, 8) }).map((_, i) => (
                <div key={i} style={{
                  width: "5px", height: "5px", borderRadius: "50%",
                  backgroundColor: isFive ? "#C41E3A" : "#1a1a1a",
                }} />
              ))}
            </div>
          </Html>
        )}
      </group>

      {/* 犯人の赤い光 */}
      {isMurderer && (
        <pointLight position={[0, 1.2, 0.5]} intensity={5} color="#C41E3A" distance={4} />
      )}
    </group>
  );
}
