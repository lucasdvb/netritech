import { UnsignedByteType } from "three";
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame } from "remotion";
import { MeshReflectorMaterial, RoundedBox, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, DepthOfField } from "@react-three/postprocessing";
export const Test = () => {
  const f = useCurrentFrame();
  return (
    <ThreeCanvas width={1920} height={1080} camera={{ position: [0, 2, 6], fov: 35 }} shadows gl={{ antialias: true, preserveDrawingBuffer: true }}>
      <color attach="background" args={["#0D141F"]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, -4]} intensity={3} castShadow color="#ffb070" />
      <RoundedBox args={[1, 1, 1]} radius={0.1} position={[0, 0.5, 0]} rotation={[0, f * 0.05, 0]} castShadow>
        <meshPhysicalMaterial color="#888" metalness={0.8} roughness={0.3} clearcoat={1} />
      </RoundedBox>
      <mesh position={[1.5, 0.3, 0]}><sphereGeometry args={[0.3, 32, 32]} /><meshBasicMaterial color={[0.4, 2.5, 2.6]} toneMapped={false} /></mesh>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.6} scale={6} blur={2} frames={1} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <MeshReflectorMaterial resolution={512} mirror={0.6} blur={[300, 100]} mixBlur={1} mixStrength={2} roughness={0.8} color="#151a22" metalness={0.5} />
      </mesh>
      <EffectComposer multisampling={0} frameBufferType={UnsignedByteType}>
        
        <Bloom mipmapBlur intensity={1.2} luminanceThreshold={0.8} />
      </EffectComposer>
    </ThreeCanvas>
  );
};
