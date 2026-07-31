import React, { Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ScrollControls, Environment, Loader, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import Laptop from './Laptop';
import Overlay from './Overlay';



export default function Experience() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 0,
        // Soft radial glow roughly behind the laptop's hero position — gives
        // the eye somewhere to travel toward instead of flat black, and
        // reads as "spotlight" rather than "empty void". Tune the 68%/42%
        // position if you change the laptop's hero X offset.
        background:
          'radial-gradient(ellipse 70% 60% at 68% 42%, rgba(139,92,246,0.16) 0%, rgba(5,5,5,0) 60%), #050505',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        {/* No opaque <color attach="background"> here on purpose — the CSS
            radial gradient behind the canvas shows through instead of flat
            black, which is what gives the scene depth/atmosphere. */}

        {/* Ambient dropped from 0.8 → 0.32. The old value flattened the
            laptop's form — directional lights now do the actual modeling. */}
        <ambientLight intensity={0.32} />
        <Environment resolution={256}>
          {/* Ceiling Softbox: Creates the main wide highlight across the metal deck */}
          <Lightformer form="rect" intensity={2} position={[0, 5, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
          
          {/* Side Softboxes: Creates sharp rim reflections on the screen bezels and side edges */}
          <Lightformer form="rect" intensity={1.5} position={[-5, 0, 0]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
          <Lightformer form="rect" intensity={1.5} position={[5, 0, 0]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
          
          {/* Subtle under-fill to prevent completely pitch black shadow areas */}
          <Lightformer form="rect" intensity={0.25} position={[0, -5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        </Environment>
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        {/* Rim/kicker light — traces the laptop's edge against the dark
            background so it doesn't disappear into the void, and ties the
            lighting to the brand accent color instead of being neutral-white */}
        <directionalLight position={[-6, 3, -6]} intensity={2.2} color="#8b5cf6" />
        <pointLight position={[0, -5, 5]} intensity={1.1} color="#4f46e5" />

        <ScrollControls pages={5} damping={0.15}>
          <Suspense fallback={null}>
            <Laptop />
          </Suspense>
          <Overlay />
        </ScrollControls>
      </Canvas>
      <Loader 
        containerStyles={{ background: '#050505' }} // match background
        innerStyles={{ width: '300px' }} // loading bar width
        barStyles={{ background: '#8b5cf6' }} // brand color loading bar
        dataInterpolation={(p) => `Loading Experience ${p.toFixed(0)}%`} // custom text
        dataStyles={{ color: '#a1a1aa', fontFamily: 'monospace', fontSize: '14px' }} 
      />
    </div>
  );
}
