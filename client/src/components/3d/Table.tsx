export function Table() {
  return (
    <group>
      {/* Table surface - deep red felt */}
      <mesh position={[0, -0.05, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[5, 5, 0.1, 64]} />
        <meshStandardMaterial color="#8B1A2B" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Table edge / rim */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5, 0.15, 16, 64]} />
        <meshStandardMaterial color="#5C3D2E" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Subtle inner circle */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.2, 2.3, 64]} />
        <meshStandardMaterial color="#7A1525" roughness={0.9} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
