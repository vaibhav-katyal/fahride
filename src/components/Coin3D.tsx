import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface Coin3DProps {
  isAnimating?: boolean;
  onAnimationComplete?: () => void;
}

const CoinModel = ({ isAnimating, onAnimationComplete }: Coin3DProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const startTimeRef = useRef<number | null>(null);
  const animationFinishedRef = useRef(false);

  useEffect(() => {
    if (isAnimating) {
      startTimeRef.current = null;
      animationFinishedRef.current = false;
    }
  }, [isAnimating]);

  const { coinGeometry, rimGeometry, faceMaterial, sideMaterial } = useMemo(() => {
    // Slightly thicker coin keeps side profile visible during Y-axis spin.
    const coinGeo = new THREE.CylinderGeometry(2, 2, 0.45, 64);
    const rimGeo = new THREE.CylinderGeometry(2.05, 2.05, 0.52, 64, 1, true);

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: '#FFD700',
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 1,
    });

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.arc(256, 256, 230, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#B8860B';
      ctx.font = 'bold 300px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 256, 256);

      ctx.globalAlpha = 0.1;
      for (let i = 0; i < 1000; i += 1) {
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    const faceMat = new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0.8,
      roughness: 0.2,
      bumpMap: texture,
      bumpScale: 0.02,
    });

    return {
      coinGeometry: coinGeo,
      rimGeometry: rimGeo,
      faceMaterial: faceMat,
      sideMaterial: goldMaterial,
    };
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    if (isAnimating) {
      if (startTimeRef.current === null) {
        startTimeRef.current = state.clock.elapsedTime;
        animationFinishedRef.current = false;
      }

      const elapsed = state.clock.elapsedTime - startTimeRef.current;
      const duration = 3.0;
      const progress = Math.min(elapsed / duration, 1);

      const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4);
      const easedProgress = easeOutQuart(progress);

      const totalRotations = 8 * Math.PI;
      groupRef.current.rotation.y = easedProgress * totalRotations;
      groupRef.current.rotation.x = Math.sin(easedProgress * Math.PI) * 0.2;

      const scale = 0.8 + Math.sin(easedProgress * Math.PI) * 0.2;
      groupRef.current.scale.set(scale, scale, scale);

      if (progress === 1 && !animationFinishedRef.current) {
        animationFinishedRef.current = true;
        if (onAnimationComplete) onAnimationComplete();
      }
    } else if (!animationFinishedRef.current) {
      groupRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={groupRef} rotation={[Math.PI / 2, 0, 0]}>
      <mesh geometry={coinGeometry} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial attach="material-0" {...sideMaterial} />
        <primitive attach="material-1" object={faceMaterial} />
        <primitive attach="material-2" object={faceMaterial} />
      </mesh>
      <mesh geometry={rimGeometry} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#B8860B" metalness={1} roughness={0.1} />
      </mesh>
    </group>
  );
};

export const Coin3D = ({ isAnimating = false, onAnimationComplete }: Coin3DProps) => {
  return (
    <div className="w-full h-full min-h-[400px] relative overflow-visible bg-transparent z-[70]">
      <Canvas
        shadows
        camera={{ position: [0, 0, 8], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={1} />

        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <CoinModel isAnimating={isAnimating} onAnimationComplete={onAnimationComplete} />
        </Float>

        <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={10} blur={2} far={4.5} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};

export default Coin3D;
