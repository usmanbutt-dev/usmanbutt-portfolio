import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  useScroll,
  PresentationControls,
  ContactShadows,
  Html,
  RoundedBox,
  Text,
  Environment
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

const KEYBOARD_SEQUENCES = [
  ["MUHAMMAD", "USMAN", "BUTT"],
  ["FULLSTACK", "DEVELOPER", "REACT JS"],
  ["JAVASCRIPT", "NEXT JS", "NODE JS"]
];

const keysData = [];
const U_WIDTH = 2.9 / 15;
const U_DEPTH = 1.1 / 6;
const GAP = 0.015;

KEYBOARD_LAYOUT.forEach((row, rIdx) => {
  let currentX = -2.9 / 2;
  const z = -1.1 / 2 + rIdx * U_DEPTH + U_DEPTH / 2;
  
  row.forEach((keyDef, cIdx) => {
    const w = keyDef.u * U_WIDTH;
    const x = currentX + w / 2;
    
    let isTextSlot = false;
    let textRow = -1;
    let textCol = -1;
    
    // Rows 1, 2, 3 act as text slots (Number, QWERTY, ASDF rows)
    if (rIdx >= 1 && rIdx <= 3) {
      isTextSlot = true;
      textRow = rIdx - 1;
      textCol = cIdx;
    }
    
    keysData.push({ 
      x, z, w: w - GAP, d: U_DEPTH - GAP, rand: Math.random(), 
      isTextSlot, textRow, textCol, rIdx, cIdx,
      originalLabel: keyDef.l,
      isPowerButton: (rIdx === 0 && cIdx === 13)
    });
    
    currentX += w;
  });
});

const getSequenceChars = (sequence) => {
  const chars = new Array(keysData.length).fill("");
  const rowLimits = [14, 14, 13];
  
  // 1. Assign core text to the designated center text slots
  keysData.forEach((key, i) => {
    if (key.isTextSlot) {
      const word = sequence[key.textRow] || "";
      const len = Math.min(word.length, rowLimits[key.textRow]);
      const startOffset = Math.floor((rowLimits[key.textRow] - len) / 2);
      
      if (key.textCol >= startOffset && key.textCol < startOffset + len) {
        chars[i] = word[key.textCol - startOffset];
      }
    }
  });
  
  return chars;
};

const precomputedSequences = KEYBOARD_SEQUENCES.map(getSequenceChars);

// ------------------------------------------------------------------------------------------------
// 1. PROCEDURAL TEXTURES (Generated once in memory via Canvas API to save network requests/FPS)
// ------------------------------------------------------------------------------------------------
const createCarbonTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#888';
  ctx.fillRect(0, 0, 64, 64);
  
  ctx.fillStyle = '#555';
  ctx.fillRect(0, 0, 32, 32);
  ctx.fillRect(32, 32, 32, 32);
  
  for (let i = 0; i < 32; i += 4) {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, i, 32, 2);
    ctx.fillRect(32, 32 + i, 32, 2);
    ctx.fillRect(i, 32, 2, 32);
    ctx.fillRect(32 + i, 0, 2, 32);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(40, 40); 
  return texture;
};

const createPlasticTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(256, 256);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const v = Math.random() * 255;
    imgData.data[i] = v;
    imgData.data[i+1] = v;
    imgData.data[i+2] = v;
    imgData.data[i+3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2); 
  return texture;
};

// Singleton textures so they are only generated once per page load
let globalCarbonTexture = null;
let globalPlasticTexture = null;

function ProceduralKeyboard({ introStartRef, isCustomModeRef }) {
  const textGroupRef = useRef();
  const instancedMeshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const baseGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const plasticTexture = useMemo(() => {
    if (!globalPlasticTexture) globalPlasticTexture = createPlasticTexture();
    return globalPlasticTexture;
  }, []);
  const FINAL_HEIGHT = 0.025;
  const KEY_ANIMATION_DURATION = 0.6;
  const PHASE_DURATION = 5.0; // Seconds per phrase
  const TRANSITION_DURATION = 0.6; // Seconds to retract
  
  const modeRef = useRef(true);
  const modeSwitchTimeRef = useRef(-10.0);
  const customStartTimeRef = useRef(3.3);
  
  useFrame((state, delta) => {
    if (introStartRef.current === null) return;
    const time = state.clock.elapsedTime;
    const introElapsed = time - introStartRef.current;
    
    const KEYBOARD_START = 3.3; 
    
    if (introElapsed < KEYBOARD_START) {
      if (instancedMeshRef.current) instancedMeshRef.current.visible = false;
      if (textGroupRef.current) textGroupRef.current.visible = false;
    } else {
      if (instancedMeshRef.current) instancedMeshRef.current.visible = true;
      if (textGroupRef.current) textGroupRef.current.visible = true;
      
      if (isCustomModeRef.current !== modeRef.current) {
        modeRef.current = isCustomModeRef.current;
        modeSwitchTimeRef.current = time;
        if (modeRef.current === true) {
          customStartTimeRef.current = time + 0.5; // wait for standard keys to retract
        }
      }
      
      const timeSinceSwitch = time - modeSwitchTimeRef.current;
      
      let customCycleTime = time - customStartTimeRef.current;
      let customPhaseIdx = 0;
      let customPhaseTime = 0;
      let customTimeRemaining = 0;
      if (customCycleTime >= 0) {
        customPhaseIdx = Math.floor(customCycleTime / PHASE_DURATION) % precomputedSequences.length;
        customPhaseTime = customCycleTime % PHASE_DURATION;
        customTimeRemaining = PHASE_DURATION - customPhaseTime;
      }
      const currentChars = precomputedSequences[customPhaseIdx];

      keysData.forEach((key, i) => {
        const cascadeDelay = (key.x + 1.5) * 0.15;
        let scaleT = 0;
        let char = "";
        
        if (modeRef.current === true) {
            // CUSTOM MODE
            // 1. Standard keys retracting
            let standardRetractT = TRANSITION_DURATION - timeSinceSwitch + cascadeDelay;
            let standardScale = 0;
            if (standardRetractT >= TRANSITION_DURATION) standardScale = 1.0;
            else if (standardRetractT > 0) {
                const t = standardRetractT / TRANSITION_DURATION;
                standardScale = t * t * t;
            }
            
            // 2. Custom keys animating
            let customScale = 0;
            let customIsVisible = (currentChars[i] !== "" && currentChars[i] !== " ");
            if (customIsVisible && customCycleTime >= 0) {
                const keyLocalTime = customPhaseTime - cascadeDelay;
                const keyLocalTimeRemaining = customTimeRemaining - cascadeDelay;
                if (keyLocalTime > 0 && keyLocalTimeRemaining > 0) {
                    if (keyLocalTime < KEY_ANIMATION_DURATION) {
                        const t = keyLocalTime / KEY_ANIMATION_DURATION;
                        customScale = t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
                    } else if (keyLocalTimeRemaining < TRANSITION_DURATION) {
                        const t = keyLocalTimeRemaining / TRANSITION_DURATION;
                        customScale = t * t * t;
                    } else {
                        customScale = 1.0;
                    }
                }
            }
            
            scaleT = Math.max(standardScale, customScale);
            char = standardScale > customScale ? key.originalLabel : currentChars[i];
            
        } else {
            // STANDARD MODE
            // 1. Custom keys retracting
            let customRetractT = TRANSITION_DURATION - timeSinceSwitch + cascadeDelay;
            let customScale = 0;
            let customIsVisible = (currentChars[i] !== "" && currentChars[i] !== " ");
            if (customIsVisible) {
                if (customRetractT >= TRANSITION_DURATION) customScale = 1.0;
                else if (customRetractT > 0) {
                    const t = customRetractT / TRANSITION_DURATION;
                    customScale = t * t * t;
                }
            }
            
            // 2. Standard keys popping up
            const standardStartTime = timeSinceSwitch - 0.5;
            let standardScale = 0;
            if (standardStartTime > 0) {
                const keyLocalTime = standardStartTime - cascadeDelay;
                if (keyLocalTime > 0) {
                    if (keyLocalTime < KEY_ANIMATION_DURATION) {
                        const t = keyLocalTime / KEY_ANIMATION_DURATION;
                        standardScale = t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
                    } else {
                        standardScale = 1.0;
                    }
                }
            }
            
            scaleT = Math.max(customScale, standardScale);
            char = customScale > standardScale ? currentChars[i] : key.originalLabel;
        }
        
        let scaleX = key.w;
        let scaleZ = key.d;
        const scaleY = Math.max(0.0001, scaleT * FINAL_HEIGHT);
        let currentY = scaleY / 2;
        
        // Completely bury and shrink inactive keys so they don't catch light
        if (scaleT <= 0.001) {
          scaleX = 0.0001;
          scaleZ = 0.0001;
          currentY = -0.1;
        }

        dummy.position.set(key.x, currentY, key.z);
        dummy.scale.set(scaleX, scaleY, scaleZ);
        dummy.updateMatrix();
        if (instancedMeshRef.current) {
          instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
        }

        const textGroup = textGroupRef.current.children[i];
        if (textGroup && textGroup.children.length > 0) {
          const textNode = textGroup.children[0];
          
          if (textNode.text !== char) {
             textNode.text = char;
          }
          
          if (scaleY <= 0.001 || char === "") {
            textNode.visible = false;
          } else {
            textNode.visible = true;
            textNode.position.set(key.x, currentY + scaleY / 2 + 0.001, key.z);
          }
        }
      });
      
      if (instancedMeshRef.current) {
        instancedMeshRef.current.instanceMatrix.needsUpdate = true;
      }
    }
  });

  return (
    <group position={[0, 0.02, 0.2]}>
      {/* PROCEDURAL KEYBOARD */}
      <instancedMesh 
        ref={instancedMeshRef} 
        args={[null, null, keysData.length]} 
        receiveShadow 
        castShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color="#0c0c0e" 
          metalness={0.3} 
          roughness={0.8} 
          bumpMap={plasticTexture}
          bumpScale={0.002}
        />
      </instancedMesh>
      
      <group ref={textGroupRef}>
        {keysData.map((key, i) => (
          <group key={i}>
              <Text
                position={[key.x, FINAL_HEIGHT + 0.001, key.z]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.06}
                color="#d4d4d8"
                anchorX="center"
                anchorY="middle"
                depthOffset={-1}
                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZJhjp-Ek-_EeAmM.woff"
              >
                {precomputedSequences[0][i]}
              </Text>
          </group>
        ))}
      </group>
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
      // Zoomed out much more for portrait mobile screens so horizontal width of laptop fits without clipping
      return { x: 0, y: -0.2, z: 0.5, rotX: 0, rotY: 0, rotZ: 0, scale: 0.6, animT: 0, camX: 0, camY: 4.5, camZ: 4.5, camTargetX: 0, camTargetY: -0.2, camTargetZ: 0.5 };
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
    return { x: 0, y: -1.5, z: 0.5, rotX: 0, rotY: 0, rotZ: 0, scale: 1.2, animT: 0, camX: 0, camY: 1.8, camZ: 2, camTargetX: 0, camTargetY: -1.5, camTargetZ: 0.5 };
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
    position: 'relative'
  };

  return (
    <div style={base}>
      {/* CSS Glass Glare Overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 40%)',
        pointerEvents: 'none',
        zIndex: 10
      }} />
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

export default function Laptop(props) {
  const groupRef = useRef();
  const shadowRef = useRef();
  const hingeRef = useRef();
  const bobRef = useRef();
  const underglowRef = useRef();
  
  const scroll = useScroll();
  const isMobile = useIsMobile();
  const isCustomModeRef = useRef(true);

  const [stage, setStage] = useState(0);
  const stageRef = useRef(0);
  const introStartRef = useRef(null);
  const prevOffsetRef = useRef(0);
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  const carbonTexture = useMemo(() => {
    if (!globalCarbonTexture) globalCarbonTexture = createCarbonTexture();
    return globalCarbonTexture;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current || !hingeRef.current) return;

    const r1 = scroll.offset;

    const newStage = r1 < 0.2 ? 0 : r1 < 0.4 ? 1 : r1 < 0.6 ? 2 : r1 < 0.8 ? 3 : 4;
    if (newStage !== stageRef.current) {
      stageRef.current = newStage;
      setStage(newStage);
    }

    const scrollVelocity = Math.abs(r1 - prevOffsetRef.current) / Math.max(delta, 0.0001);
    prevOffsetRef.current = r1;
    const settle = THREE.MathUtils.clamp(1 - scrollVelocity * 6, 0, 1);

    const target = getTargetPose(r1, isMobile, state.clock.elapsedTime);

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
      let currentCamTargetY = target.y;
      let currentCamTargetZ = 0;

      if (introT < 0.15) {
        const t = introT / 0.15;
        const ease = 1 - Math.pow(1 - t, 3);
        currentY = THREE.MathUtils.lerp(8, target.y, ease);
        currentZ = THREE.MathUtils.lerp(0, target.z, ease);
      } else if (introT < 0.45) {
        const t = (introT - 0.15) / 0.3;
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        currentRotY = THREE.MathUtils.lerp(0, Math.PI * 4, ease);
        currentScale = THREE.MathUtils.lerp(0.3, target.scale, ease);
        currentHinge = THREE.MathUtils.lerp(HINGE_CLOSED, targetHingeAngle, ease);
        currentY = target.y;
        currentZ = target.z;
        const wideCamZ = target.camZ + 1.0;
        currentCamZ = THREE.MathUtils.lerp(5, wideCamZ, ease);
      } else if (introT < 0.55) {
        const t = (introT - 0.45) / 0.1;
        const ease = 1 - Math.pow(1 - t, 3);
        currentRotY = Math.PI * 4;
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
        const t = (introT - 0.55) / 0.1;
        const ease = t * t * (3 - 2 * t);
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
      if (underglowRef.current) {
        const time = state.clock.elapsedTime;
        const r = (Math.sin(time * 2.0) + 1) / 2;
        const g = (Math.sin(time * 2.0 + 2) + 1) / 2;
        const b = (Math.sin(time * 2.0 + 4) + 1) / 2;
        underglowRef.current.material.color.setRGB(r * 0.8, g * 0.8, b * 0.8);
        underglowRef.current.material.emissive.setRGB(r * 0.5, g * 0.5, b * 0.5);
      }
    } else {
      const damp = THREE.MathUtils.damp;
      const lambda = 4;

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

      hingeRef.current.rotation.x = damp(hingeRef.current.rotation.x, targetHingeAngle, lambda * 1.5, delta);
      
      state.camera.position.x = damp(state.camera.position.x, target.camX, lambda, delta);
      state.camera.position.y = damp(state.camera.position.y, target.camY, lambda, delta);
      state.camera.position.z = damp(state.camera.position.z, target.camZ, lambda, delta);
      
      cameraTargetRef.current.x = damp(cameraTargetRef.current.x, target.camTargetX, lambda, delta);
      cameraTargetRef.current.y = damp(cameraTargetRef.current.y, target.camTargetY, lambda, delta);
      cameraTargetRef.current.z = damp(cameraTargetRef.current.z, target.camTargetZ, lambda, delta);
      state.camera.lookAt(cameraTargetRef.current);

      if (underglowRef.current) {
        const time = state.clock.elapsedTime;
        const r = (Math.sin(time * 1.5) + 1) / 2;
        const g = (Math.sin(time * 1.5 + 2) + 1) / 2;
        const b = (Math.sin(time * 1.5 + 4) + 1) / 2;
        underglowRef.current.material.color.setRGB(r * 0.8, g * 0.8, b * 0.8);
        underglowRef.current.material.emissive.setRGB(r * 0.5, g * 0.5, b * 0.5);
      }
    }

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
      {/* Base Chassis */}
      <RoundedBox args={[3.6, 0.1, 2.4]} radius={0.02} position={[0, -0.05, 0]}>
        <meshStandardMaterial 
          color="#050505" 
          metalness={0.7} 
          roughness={0.8}
          bumpMap={carbonTexture}
          bumpScale={0.005}
          roughnessMap={carbonTexture}
        />
      </RoundedBox>
      
      {/* Extended Back Exhaust Block (Alienware m15 R5 style) */}
      <RoundedBox args={[3.6, 0.15, 0.4]} radius={0.02} position={[0, -0.025, -1.3]}>
        <meshStandardMaterial 
          color="#050505" 
          metalness={0.7} 
          roughness={0.8}
          bumpMap={carbonTexture}
          bumpScale={0.005}
          roughnessMap={carbonTexture}
        />
      </RoundedBox>

      {/* The Tron Ring (Glowing ring around the exhaust) */}
      <mesh position={[0, -0.075, -1.52]}>
        <boxGeometry args={[3.45, 0.06, 0.05]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      
      {/* Keyboard Well Indent */}
      <mesh position={[0, 0.01, 0.2]}>
        <boxGeometry args={[3.0, 0.02, 1.2]} />
        <meshStandardMaterial color="#080808" />
      </mesh>

      {/* RGB Underglow Plate */}
      <mesh ref={underglowRef} position={[0, 0.01, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.9, 1.1]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={1} toneMapped={false} />
      </mesh>

      {/* Alienware Procedural Keyboard Matrix */}
      <ProceduralKeyboard introStartRef={introStartRef} isCustomModeRef={isCustomModeRef} />
      
      {/* Glowing Power Button (Alien Logo Style) */}
      <mesh 
        position={[1.5, 0.015, -0.45]} 
        rotation={[0, Math.PI / 6, 0]}
        onClick={(e) => {
          e.stopPropagation();
          isCustomModeRef.current = !isCustomModeRef.current;
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <cylinderGeometry args={[0.04, 0.04, 0.01, 6]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      
      {/* Speaker / Ventilation Grille (Sports car vent style) */}
      <group position={[-0.1, 0.01, -0.65]}>
        {[...Array(5)].map((_, i) => (
          <mesh key={i} position={[0, 0, i * 0.06 - 0.12]}>
            <boxGeometry args={[2.9, 0.01, 0.02]} />
            <meshStandardMaterial color="#050505" roughness={0.9} />
          </mesh>
        ))}
      </group>
      
      {/* Trackpad (Wide, glass-like surface) */}
      <RoundedBox args={[1.2, 0.005, 0.4]} radius={0.01} position={[0, 0.0025, 0.97]}>
        <meshStandardMaterial color="#0d0d0f" metalness={0.6} roughness={0.4} />
      </RoundedBox>

      {/* 2. HINGE AND LID ASSEMBLY */}
      {/* Hinge Pivot (positioned slightly forward from the back exhaust) */}
      <group ref={hingeRef} position={[0, 0.0, -0.9]}>
        
        {/* Left Hinge Joint */}
        <mesh position={[-1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.4, 32]} />
          <meshStandardMaterial color="#0a0a0b" roughness={0.4} metalness={0.8} />
        </mesh>
        
        {/* Right Hinge Joint */}
        <mesh position={[1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.4, 32]} />
          <meshStandardMaterial color="#0a0a0b" roughness={0.4} metalness={0.8} />
        </mesh>
        {/* Lid Assembly (Offset so the bottom edge pivots precisely at the hinge) */}
        <group position={[0, 1.1, 0]}>
          
          {/* Lid Outer Shell */}
          <RoundedBox args={[3.6, 2.2, 0.1]} radius={0.02} position={[0, 0, -0.05]}>
            <meshStandardMaterial 
              color="#050505" 
              metalness={0.7} 
              roughness={0.8}
              bumpMap={carbonTexture}
              bumpScale={0.005}
              roughnessMap={carbonTexture}
            />
          </RoundedBox>

          {/* Glowing Lid Logo (Alien Hexagon) */}
          <mesh position={[0, 0, -0.101]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.01, 6]} />
            <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={2} toneMapped={false} />
          </mesh>

          {/* Screen Inner Bezel / Rubber Gasket */}
          <mesh position={[0, 0, 0.01]}>
            <boxGeometry args={[3.5, 2.1, 0.02]} />
            <meshStandardMaterial color="#020202" roughness={0.9} metalness={0.1} />
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
      <Environment preset="city" />
      
      <group ref={groupRef}>
        {ProceduralLaptopGeometry}
      </group>

      <group ref={shadowRef}>
        <ContactShadows resolution={256} opacity={0.55} scale={6} blur={2.4} far={2} color="#000000" />
      </group>
    </>
  );
}
