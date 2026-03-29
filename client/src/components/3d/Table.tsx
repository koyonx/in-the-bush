export function Table() {
  return (
    <group>
      {/* テーブル天板 */}
      <mesh position={[0, -0.05, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3, 3, 0.1, 64]} />
        <meshStandardMaterial
          color="#5C2E20"
          emissive="#2A1510"
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* テーブル縁 */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3, 0.04, 8, 64]} />
        <meshStandardMaterial
          color="#C9A96E"
          emissive="#8B7040"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>

      {/* 内側の装飾円 */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.4, 1.44, 64]} />
        <meshStandardMaterial
          color="#C9A96E"
          emissive="#6B5030"
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* 床面 */}
      <mesh position={[0, -0.12, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial
          color="#201a14"
          emissive="#100c08"
          emissiveIntensity={0.3}
          roughness={0.95}
        />
      </mesh>
    </group>
  );
}
