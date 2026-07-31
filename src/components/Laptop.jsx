import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  useScroll,
  PresentationControls,
  ContactShadows,
  Html,
  RoundedBox,
  Text
} from '@react-three/drei';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────
// ⚠️ PROCEDURAL LAPTOP TUNING
// The laptop is now built entirely out of geometric primitives (no GLTF).
// SCREEN_TRANSFORM is calibrated precisely to the mathematical center of
// the inner lid face.
// ─────────────────────────────────────────────────────────────────────────
const SCREEN_TRANSFORM = {
  position: [0, 1.1, 0.026], // Attached flush against the inner lid assembly
  rotation: [0, 0, 0], // The HTML naturally rotates with the physical hinge now!
  scale: 0.0074, // Maps the 460px DOM element to the 3.4 unit 3D screen width
};

const INTRO_DURATION = 6.0; // seconds
const INTRO_START_POSE = {
  x: 0,
  y: 8, // Out of bounds on the top
  z: 0,
  rotX: 0,
  rotY: Math.PI * 4, // 2 full quick rotations
  rotZ: 0,
  scale: 0.3,
  animT: 0,
  camX: 0,
  camY: 0,
  camZ: 5,
  camTargetX: 0,
  camTargetY: 0,
  camTargetZ: 0
};

// ─────────────────────────────────────────────────────────────────────────
// ⌨️ KEYBOARD GENERATION
// ─────────────────────────────────────────────────────────────────────────
const KEYBOARD_LAYOUT = [
  [{u:1, l:"Esc"}, {u:1, l:"F1"}, {u:1, l:"F2"}, {u:1, l:"F3"}, {u:1, l:"F4"}, {u:1, l:"F5"}, {u:1, l:"F6"}, {u:1, l:"F7"}, {u:1, l:"F8"}, {u:1, l:"F9"}, {u:1, l:"F10"}, {u:1, l:"F11"}, {u:1, l:"F12"}, {u:2, l:"Del"}],
  [{u:1, l:"~"}, {u:1, l:"1"}, {u:1, l:"2"}, {u:1, l:"3"}, {u:1, l:"4"}, {u:1, l:"5"}, {u:1, l:"6"}, {u:1, l:"7"}, {u:1, l:"8"}, {u:1, l:"9"}, {u:1, l:"0"}, {u:1, l:"-"}, {u:1, l:"="}, {u:2, l:"Backspace"}],
  [{u:1.5, l:"Tab"}, {u:1, l:"Q"}, {u:1, l:"W"}, {u:1, l:"E"}, {u:1, l:"R"}, {u:1, l:"T"}, {u:1, l:"Y"}, {u:1, l:"U"}, {u:1, l:"I"}, {u:1, l:"O"}, {u:1, l:"P"}, {u:1, l:"["}, {u:1, l:"]"}, {u:1.5, l:"\\"}],
  [{u:1.75, l:"Caps"}, {u:1, l:"A"}, {u:1, l:"S"}, {u:1, l:"D"}, {u:1, l:"F"}, {u:1, l:"G"}, {u:1, l:"H"}, {u:1, l:"J"}, {u:1, l:"K"}, {u:1, l:"L"}, {u:1, l:";"}, {u:1, l:"'"}, {u:2.25, l:"Enter"}],
  [{u:2.25, l:"Shift"}, {u:1, l:"Z"}, {u:1, l:"X"}, {u:1, l:"C"}, {u:1, l:"V"}, {u:1, l:"B"}, {u:1, l:"N"}, {u:1, l:"M"}, {u:1, l:","}, {u:1, l:"."}, {u:1, l:"/"}, {u:2, l:"Shift"}, {u:0.75, l:"^"}],
  [{u:1.25, l:"Ctrl"}, {u:1.25, l:"Win"}, {u:1.25, l:"Alt"}, {u:6.25, l:""}, {u:1.25, l:"Alt"}, {u:1.25, l:"Fn"}, {u:0.83, l:"<"}, {u:0.84, l:"v"}, {u:0.83, l:">"}]
];

const keysData = [];
const U_WIDTH = 2.9 / 15;
const U_DEPTH = 1.1 / 6;
const GAP = 0.015;

KEYBOARD_LAYOUT.forEach((row, rowIndex) => {
  let currentX = -2.9 / 2;
  const z = -1.1 / 2 + rowIndex * U_DEPTH + U_DEPTH / 2;
  
  row.forEach((keyDef) => {
    const w = keyDef.u * U_WIDTH;
    const x = currentX + w / 2;
    keysData.push({ x, z, w: w - GAP, d: U_DEPTH - GAP, l: keyDef.l, rand: Math.random() });
    currentX += w;
  });
});

function ProceduralKeyboard({ introStartRef }) {
  const groupRef = React.useRef();
  const baseGeometry = React.useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const FINAL_HEIGHT = 0.025;
  
  useFrame(({ clock }) => {
    if (!groupRef.current || introStartRef.current === null) return;
    const time = clock.elapsedTime;
    const introElapsed = time - introStartRef.current;
    
    // Wait until the camera intro finishes and begins its push-in (3.3s)
    const KEYBOARD_START = 3.3; 
    
    groupRef.current.children.forEach((keyGroup, i) => {
      const key = keysData[i];
      let scaleY = 0;
      
      // Map key's X position (-1.45 to 1.45) to a normalized 0 to 1 range
      const nx = (key.x + 1.45) / 2.9; 
      
      // Calculate when this specific key should start growing
      // Sweeps from left (nx=0) to right (nx=1) over 1.2 seconds
      const keyDelay = KEYBOARD_START + (nx * 1.2); 
      const keyGrowTime = introElapsed - keyDelay;
      
      if (keyGrowTime > 0) {
        // Individual key takes 0.6 seconds to grow
        const progress = keyGrowTime / 0.6;
        const eased = THREE.MathUtils.clamp(progress, 0, 1);
        scaleY = Math.pow(eased, 0.5) * FINAL_HEIGHT; 
      }
      
      const mesh = keyGroup.children[0];
      const text = keyGroup.children[1];
      
      mesh.scale.set(key.w, Math.max(scaleY, 0.001), key.d);
      mesh.position.set(key.x, scaleY / 2, key.z);
      
      if (text) {
        text.position.set(key.x, scaleY + 0.001, key.z);
      }
      
      if (scaleY <= 0.0001) {
        mesh.visible = false;
        if (text) text.visible = false;
      } else {
        mesh.visible = true;
        if (text) text.visible = true;
      }
      
      // Static Alienware cyan backlight
      mesh.material.emissive.set('#38bdf8');
      mesh.material.emissiveIntensity = scaleY > 0.005 ? 0.3 : 0; 
    });
  });

  return (
    <group ref={groupRef} position={[0, 0.02, 0.2]}>
      {keysData.map((key, i) => (
        <group key={i}>
          <mesh geometry={baseGeometry}>
            <meshStandardMaterial color="#000000" metalness={0.9} roughness={0.4} />
          </mesh>
          {key.l && (
            <Text
              position={[key.x, FINAL_HEIGHT + 0.001, key.z]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.06}
              color="#d4d4d8"
              anchorX="center"
              anchorY="middle"
              depthOffset={-1}
            >
              {key.l}
            </Text>
          )}
        </group>
      ))}
    </group>
  );
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

function getTargetPose(r1, isMobile, elapsedTime) {
  const defCam = { camX: 0, camY: 0, camZ: 5, camTargetX: 0, camTargetY: 0, camTargetZ: 0 };

  if (isMobile) {
    if (r1 < 0.2) {
      return { x: 0, y: -0.2, z: 0.5, rotX: 0, rotY: 0, rotZ: 0, scale: 0.6, animT: 0, camX: 0, camY: 2.5, camZ: 2.5, camTargetX: 0, camTargetY: -0.2, camTargetZ: 0 };
    } else if (r1 < 0.4) {
      return { x: 0, y: -0.1, z: 0, rotX: -0.05, rotY: -0.25, rotZ: 0, scale: 0.4, animT: 0, ...defCam };
    } else if (r1 < 0.6) {
      return { x: 0.2, y: -0.1, z: 0, rotX: 0.15, rotY: 0.5, rotZ: 0, scale: 0.35, animT: 0, ...defCam };
    } else if (r1 < 0.8) {
      return { x: -0.2, y: -0.7, z: -0.5, rotX: 0.6, rotY: -0.1, rotZ: 0, scale: 0.3, animT: 0, ...defCam };
    }
    return { x: 0, y: -0.6, z: 0, rotX: 0.2, rotY: elapsedTime * 0.3, rotZ: 0, scale: 0.3, animT: 1, ...defCam };
  }

  // Desktop precisely tuned for a 3.6 unit wide procedural laptop to stay fully in bounds
  if (r1 < 0.2) {
    // Laptop remains flat on the floor (rotX: 0), camera moves UP and looks DOWN at the keyboard!
    return { x: 0, y: -1.5, z: 0.5, rotX: 0, rotY: 0, rotZ: 0, scale: 1.2, animT: 0, camX: 0, camY: 2.0, camZ: 2.0, camTargetX: 0, camTargetY: -1.5, camTargetZ: 0.5 };
  } else if (r1 < 0.4) {
    return { x: 1.8, y: -1.0, z: 0, rotX: -0.08, rotY: -0.4, rotZ: 0, scale: 0.55, animT: 0, ...defCam };
  } else if (r1 < 0.6) {
    return { x: -1.6, y: -1.0, z: 0, rotX: 0.15, rotY: 1.2, rotZ: 0, scale: 0.5, animT: 0, ...defCam };
  } else if (r1 < 0.8) {
    return { x: 1.6, y: -1.6, z: -1.2, rotX: 1.0, rotY: -0.1, rotZ: 0, scale: 0.4, animT: 0, ...defCam };
  }
  return { x: 0, y: -1.6, z: 0, rotX: 0.2, rotY: elapsedTime * 0.4, rotZ: 0, scale: 0.45, animT: 1, ...defCam };
}

function ScreenContent({ stage }) {
  const mono = { fontFamily: "'JetBrains Mono', monospace" };
  const base = {
    width: 460,
    height: 288,
    background: '#0a0a0c',
    borderRadius: 6,
    padding: '18px 20px',
    color: '#d4d4d8',
    fontSize: 13,
    lineHeight: 1.7,
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  return (
    <div style={base}>
      <style>{`
        @keyframes usb-blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
        .usb-cursor { display:inline-block; width:7px; height:14px; background:#8b5cf6; animation: usb-blink 1s step-end infinite; vertical-align:middle; margin-left:2px; }
      `}</style>

      {stage === 0 && (
        <div style={mono}>
          <div style={{ color: '#71717a' }}>~/portfolio $ whoami</div>
          <div style={{ color: '#fff', marginTop: 4 }}>muhammad_usman_butt</div>
          <div style={{ color: '#71717a', marginTop: 14 }}>~/portfolio $ status</div>
          <div style={{ color: '#a78bfa', marginTop: 4 }}>full-stack engineer — building production systems</div>
          <div style={{ marginTop: 14 }}>
            <span style={{ color: '#71717a' }}>~/portfolio $</span>
            <span className="usb-cursor" />
          </div>
        </div>
      )}

      {stage === 1 && (
        <div style={mono}>
          <div style={{ display: 'flex', gap: 14, borderBottom: '1px solid #27272a', paddingBottom: 8, marginBottom: 10, color: '#71717a' }}>
            <span style={{ color: '#fff' }}>ArcSmith.tsx</span>
            <span>Pokedex.tsx</span>
          </div>
          <div><span style={{ color: '#f472b6' }}>export</span> <span style={{ color: '#60a5fa' }}>function</span> <span style={{ color: '#fff' }}>StoryGraph</span>() {'{'}</div>
          <div style={{ paddingLeft: 16 }}><span style={{ color: '#a78bfa' }}>const</span> nodes = useGraph();</div>
          <div style={{ paddingLeft: 16, color: '#71717a' }}>// branching narrative, queryable by AI agents</div>
          <div>{'}'}</div>
        </div>
      )}

      {stage === 2 && (
        <div style={mono}>
          <div style={{ color: '#71717a' }}>~/career $ log --recent</div>
          <div style={{ marginTop: 10, color: '#fff' }}>Termnl Tech <span style={{ color: '#71717a' }}>— AI &amp; RAG Engineer</span></div>
          <div style={{ color: '#71717a', fontSize: 11 }}>Jun 2026 — Present</div>
          <div style={{ marginTop: 10, color: '#fff' }}>Axiolink Game Studio <span style={{ color: '#71717a' }}>— Head of Dev</span></div>
          <div style={{ color: '#71717a', fontSize: 11 }}>Apr 2026 — Jun 2026</div>
        </div>
      )}

      {stage === 3 && (
        <div style={{ ...mono, display: 'flex', flexWrap: 'wrap', gap: 6, alignContent: 'flex-start' }}>
          {['React', 'Rust', 'Node.js', 'RAG', 'LangChain', 'Unity', 'C#', 'Python'].map((t) => (
            <span key={t} style={{ border: '1px solid #27272a', borderRadius: 999, padding: '3px 10px', fontSize: 11, color: '#a1a1aa' }}>{t}</span>
          ))}
        </div>
      )}

      {stage === 4 && (
        <div style={{ ...mono, color: '#71717a', display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
          connection closing…
        </div>
      )}
    </div>
  );
}

export default function Laptop() {
  const groupRef = useRef();
  const shadowRef = useRef();
  const hingeRef = useRef();
  const bobRef = useRef();
  
  const scroll = useScroll();
  const isMobile = useIsMobile();

  const [stage, setStage] = useState(0);
  const stageRef = useRef(0);
  const introStartRef = useRef(null);
  const prevOffsetRef = useRef(0);
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    if (!groupRef.current || !hingeRef.current) return;

    const r1 = scroll.offset;

    // Which of the 5 narrative stages we're in — drives the screen content
    const newStage = r1 < 0.2 ? 0 : r1 < 0.4 ? 1 : r1 < 0.6 ? 2 : r1 < 0.8 ? 3 : 4;
    if (newStage !== stageRef.current) {
      stageRef.current = newStage;
      setStage(newStage);
    }

    const scrollVelocity = Math.abs(r1 - prevOffsetRef.current) / Math.max(delta, 0.0001);
    prevOffsetRef.current = r1;
    const settle = THREE.MathUtils.clamp(1 - scrollVelocity * 6, 0, 1);

    const target = getTargetPose(r1, isMobile, state.clock.elapsedTime);

    // Hinge logic mapping
    // Closed (animT = 1): Lid folded down flat (Math.PI / 2 + 0.05 so it sits on keyboard)
    // Open (animT = 0): Lid titled slightly back (-0.35 radians)
    const HINGE_CLOSED = Math.PI / 2 + 0.02; 
    const HINGE_OPEN = -0.35;
    const targetHingeAngle = target.animT === 1 ? HINGE_CLOSED : HINGE_OPEN;

    if (introStartRef.current === null) introStartRef.current = state.clock.elapsedTime;
    const introElapsed = state.clock.elapsedTime - introStartRef.current;
    const introT = Math.min(1, introElapsed / INTRO_DURATION);

    if (introT < 1) {
      let currentX = 0;
      let currentY = 0;
      let currentZ = 0;
      let currentRotX = 0;
      let currentRotY = 0;
      let currentRotZ = 0;
      let currentScale = 0.3;
      let currentHinge = HINGE_CLOSED;
      
      let currentCamX = 0;
      let currentCamY = 0;
      let currentCamZ = 5;
      let currentCamTargetX = 0;
      let currentCamTargetY = target.y; // Keep looking at laptop during drop
      let currentCamTargetZ = 0;

      if (introT < 0.15) {
        // Phase 1 (0 to 0.15): Drop into center, small, lid closed.
        const t = introT / 0.15;
        const ease = 1 - Math.pow(1 - t, 3); // Ease out cubic
        currentY = THREE.MathUtils.lerp(8, target.y, ease);
        currentZ = THREE.MathUtils.lerp(0, target.z, ease);
      } else if (introT < 0.45) {
        // Phase 2 (0.15 to 0.45): Rotations, zoom in, open lid. (Slower)
        const t = (introT - 0.15) / 0.3;
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // Ease in out cubic
        currentRotY = THREE.MathUtils.lerp(0, Math.PI * 4, ease);
        currentScale = THREE.MathUtils.lerp(0.3, target.scale, ease);
        currentHinge = THREE.MathUtils.lerp(HINGE_CLOSED, targetHingeAngle, ease);
        currentY = target.y;
        currentZ = target.z;
        const wideCamZ = target.camZ + 1.0;
        currentCamZ = THREE.MathUtils.lerp(5, wideCamZ, ease); // Zoom in simultaneously
      } else if (introT < 0.55) {
        // Phase 3 (0.45 to 0.55): Tilt camera above the laptop to a wide shot
        const t = (introT - 0.45) / 0.1;
        const ease = 1 - Math.pow(1 - t, 3); // Ease out cubic
        currentRotY = Math.PI * 4; // preserve final spin
        currentScale = target.scale;
        currentHinge = targetHingeAngle;
        
        currentRotX = THREE.MathUtils.lerp(0, target.rotX, ease);
        currentY = target.y;
        currentZ = target.z;
        
        const wideCamY = target.camY + 1.5; 
        const wideCamZ = target.camZ + 1.0; 
        const wideCamTargetZ = target.camTargetZ - 0.5; 
        
        currentCamX = THREE.MathUtils.lerp(0, target.camX, ease);
        currentCamY = THREE.MathUtils.lerp(0, wideCamY, ease);
        currentCamZ = wideCamZ; 
        currentCamTargetX = THREE.MathUtils.lerp(0, target.camTargetX, ease);
        currentCamTargetY = THREE.MathUtils.lerp(target.y, target.camTargetY, ease);
        currentCamTargetZ = THREE.MathUtils.lerp(0, wideCamTargetZ, ease);
      } else if (introT < 0.65) {
        // Phase 4 (0.55 to 0.65): QUICK Push in camera to look closely at keyboard growing
        const t = (introT - 0.55) / 0.1;
        const ease = t * t * (3 - 2 * t); // Smooth step
        currentRotY = Math.PI * 4;
        currentScale = target.scale;
        currentHinge = targetHingeAngle;
        currentRotX = target.rotX;
        currentY = target.y;
        currentZ = target.z;
        
        const wideCamY = target.camY + 1.5; 
        const wideCamZ = target.camZ + 1.0; 
        const wideCamTargetZ = target.camTargetZ - 0.5; 
        
        currentCamX = target.camX;
        currentCamY = THREE.MathUtils.lerp(wideCamY, target.camY, ease);
        currentCamZ = THREE.MathUtils.lerp(wideCamZ, target.camZ, ease);
        currentCamTargetX = target.camTargetX;
        currentCamTargetY = target.camTargetY;
        currentCamTargetZ = THREE.MathUtils.lerp(wideCamTargetZ, target.camTargetZ, ease);
      } else {
        // Phase 5 (0.65 to 1.0): HOLD camera closely while keyboard finishes growing
        currentRotY = Math.PI * 4;
        currentScale = target.scale;
        currentHinge = targetHingeAngle;
        currentRotX = target.rotX;
        currentY = target.y;
        currentZ = target.z;
        
        currentCamX = target.camX;
        currentCamY = target.camY;
        currentCamZ = target.camZ;
        currentCamTargetX = target.camTargetX;
        currentCamTargetY = target.camTargetY;
        currentCamTargetZ = target.camTargetZ;
      }

      groupRef.current.position.set(currentX, currentY, currentZ);
      groupRef.current.rotation.set(currentRotX, currentRotY, currentRotZ);
      groupRef.current.scale.set(currentScale, currentScale, currentScale);
      hingeRef.current.rotation.x = currentHinge;
      
      state.camera.position.set(currentCamX, currentCamY, currentCamZ);
      cameraTargetRef.current.set(currentCamTargetX, currentCamTargetY, currentCamTargetZ);
      state.camera.lookAt(cameraTargetRef.current);
    } else {
      const damp = THREE.MathUtils.damp;
      const lambda = 4; // Lower is smoother/slower, higher is snappier

      // Normalize rotation Y to prevent violently unwinding the intro spin
      if (groupRef.current.rotation.y >= Math.PI * 2) {
        groupRef.current.rotation.y %= (Math.PI * 2);
      }

      groupRef.current.position.x = damp(groupRef.current.position.x, target.x, lambda, delta);
      groupRef.current.position.y = damp(groupRef.current.position.y, target.y, lambda, delta);
      groupRef.current.position.z = damp(groupRef.current.position.z, target.z, lambda, delta);
      groupRef.current.rotation.x = damp(groupRef.current.rotation.x, target.rotX, lambda, delta);
      groupRef.current.rotation.y = damp(groupRef.current.rotation.y, target.rotY, lambda, delta);
      groupRef.current.rotation.z = damp(groupRef.current.rotation.z, target.rotZ, lambda, delta);
      
      const currentScale = groupRef.current.scale.x;
      const newScale = damp(currentScale, target.scale, lambda, delta);
      groupRef.current.scale.set(newScale, newScale, newScale);

      // Smooth hinge animation
      hingeRef.current.rotation.x = damp(hingeRef.current.rotation.x, targetHingeAngle, lambda * 1.5, delta);
      
      // Smooth camera animation
      state.camera.position.x = damp(state.camera.position.x, target.camX, lambda, delta);
      state.camera.position.y = damp(state.camera.position.y, target.camY, lambda, delta);
      state.camera.position.z = damp(state.camera.position.z, target.camZ, lambda, delta);
      
      cameraTargetRef.current.x = damp(cameraTargetRef.current.x, target.camTargetX, lambda, delta);
      cameraTargetRef.current.y = damp(cameraTargetRef.current.y, target.camTargetY, lambda, delta);
      cameraTargetRef.current.z = damp(cameraTargetRef.current.z, target.camTargetZ, lambda, delta);
      state.camera.lookAt(cameraTargetRef.current);
    }

    // Idle breathing — applied to the inner bobRef using absolute assignment.
    // Runs unconditionally every frame so it floats naturally during the intro too!
    if (bobRef.current) {
      const bob = Math.sin(state.clock.elapsedTime * 1.1) * 0.08 * settle;
      const sway = Math.sin(state.clock.elapsedTime * 0.7) * 0.04 * settle;
      bobRef.current.position.y = bob;
      bobRef.current.rotation.z = sway * 0.3;
      bobRef.current.rotation.x = sway * 0.15;
    }

    if (shadowRef.current) {
      shadowRef.current.position.x = groupRef.current.position.x;
      shadowRef.current.position.z = groupRef.current.position.z - 0.3;
      shadowRef.current.position.y = groupRef.current.position.y - 1.0;
      const shadowScale = groupRef.current.scale.x / 2.4;
      shadowRef.current.scale.set(shadowScale, 1, shadowScale);
    }
  });

  const ProceduralLaptopGeometry = (
    <group ref={bobRef} position={[0, 0, 0]}>
      {/* 1. BASE ASSEMBLY */}
      {/* Main Front Deck */}
      <RoundedBox args={[3.6, 0.15, 2.4]} radius={0.02} position={[0, -0.075, 0.3]}>
        <meshStandardMaterial color="#141416" metalness={0.9} roughness={0.2} />
      </RoundedBox>
      
      {/* Extended Back Exhaust Block (Alienware m15 R5 style) */}
      <RoundedBox args={[3.6, 0.15, 0.6]} radius={0.02} position={[0, -0.075, -1.2]}>
        <meshStandardMaterial color="#0c0c0d" metalness={0.8} roughness={0.3} />
      </RoundedBox>

      {/* The Tron Ring (Glowing ring around the exhaust) */}
      <mesh position={[0, -0.075, -1.52]}>
        <boxGeometry args={[3.45, 0.06, 0.05]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={2} />
      </mesh>
      
      {/* Keyboard Well Indent */}
      <mesh position={[0, 0.01, 0.2]}>
        <boxGeometry args={[3.0, 0.02, 1.2]} />
        <meshStandardMaterial color="#080808" />
      </mesh>
      {/* Alienware Procedural Keyboard Matrix */}
      <ProceduralKeyboard introStartRef={introStartRef} />
      
      {/* Trackpad */}
      <mesh position={[0, 0.015, 1.1]}>
        <boxGeometry args={[1.0, 0.01, 0.6]} />
        <meshStandardMaterial color="#1a1a1c" roughness={0.6} />
      </mesh>

      {/* 2. HINGE AND LID ASSEMBLY */}
      {/* Hinge Pivot (positioned slightly forward from the back exhaust) */}
      <group ref={hingeRef} position={[0, 0.0, -0.9]}>
        
        {/* Lid Assembly (Offset so the bottom edge pivots precisely at the hinge) */}
        <group position={[0, 1.1, 0]}>
          
          {/* Lid Outer Shell */}
          <RoundedBox args={[3.6, 2.2, 0.1]} radius={0.02} position={[0, 0, -0.05]}>
            <meshStandardMaterial color="#141416" metalness={0.9} roughness={0.2} />
          </RoundedBox>

          {/* Screen Inner Bezel */}
          <mesh position={[0, 0, 0.01]}>
            <boxGeometry args={[3.5, 2.1, 0.02]} />
            <meshStandardMaterial color="#050505" />
          </mesh>

          {/* Screen Panel (Pitch Black display surface) */}
          <mesh position={[0, 0, 0.025]}>
            <planeGeometry args={[3.4, 2.0]} />
            <meshBasicMaterial color="#000" />
          </mesh>
          
          {/* HTML Mount Point (Perfectly flush on the screen) */}
          <Html
            transform
            occlude={false}
            position={SCREEN_TRANSFORM.position}
            rotation={SCREEN_TRANSFORM.rotation}
            scale={SCREEN_TRANSFORM.scale}
            style={{ pointerEvents: 'none' }}
          >
            <ScreenContent stage={stage} />
          </Html>
          
        </group>
      </group>
    </group>
  );

  return (
    <>
      <group ref={groupRef}>
        {ProceduralLaptopGeometry}
      </group>

      <group ref={shadowRef}>
        <ContactShadows opacity={0.55} scale={6} blur={2.4} far={2} color="#000000" />
      </group>
    </>
  );
}
