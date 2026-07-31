# Implementation Plan: Procedural Alienware m15 R5 Keyboard

## Goal
Build a procedural 3D keyboard for the laptop that matches the Alienware m15 R5 layout. The keys will physically "grow" upwards with a cool animation after the laptop opens, and feature a dynamic RGB wave lighting effect.

## Proposed Changes

### 1. Keyboard Layout Data Structure
We will define a grid layout for the keys inside `Laptop.jsx` (or a separate file if it's too large, but `Laptop.jsx` is fine).
Each key will have:
- `w`: width multiplier
- `x`, `z`: position coordinates
- `type`: standard, spacebar, etc.

### 2. Component: `<Keyboard />`
Create a new sub-component inside `Laptop.jsx` to handle the rendering and animation of the keys.
- **Geometry**: We will use a shared `boxGeometry` (or `RoundedBox` if performance permits) to keep it lightweight.
- **Keys**: We'll map over the layout array and render individual `<mesh>` instances for each key.
- **Animation**: Inside `useFrame`, we will track `stage` and `introT`. As `introT` progresses past the lid opening phase, the keys will individually animate their `scale.y` from 0 to 1, creating a cascading "growing" effect.
- **RGB Wave**: We will apply a continuous color-shifting `emissive` wave across the keys using `Math.sin(time + key.x)`. This perfectly matches the Alienware RGB aesthetic.

### 3. Key Textures / Text
Adding individual 3D text to 85+ keys is extremely expensive for WebGL performance (creates 85+ separate text geometries and materials). 
**Proposed Solution**: 
- We will design the keys as "stealth" tactile chiclet keys (pitch black with glowing RGB bases/edges).
- We will generate a high-quality Canvas texture representing the Alienware font (or a tech font) for the keycaps, OR we rely purely on the glowing physical geometry for the aesthetic. I recommend the stealth RGB geometry approach for maximum performance and cinematic feel, but we can embed a single texture overlay if required.

## Open Questions
> [!IMPORTANT]
> 1. Rendering 80+ 3D text labels (like 'A', 'B', 'Enter') will heavily impact performance. Are you okay with "Stealth" keys (dark metallic keys with a vibrant, animated RGB underglow wave), or do you strictly want the letters printed on the keys?
> 2. I will make the keys ripple and grow upwards as the laptop opens. Does this match your vision for the "growing up" animation?

## Verification
- Ensure frame rates remain above 60 FPS during the animation.
- Verify the Alienware layout (6 rows, correct width proportions).
- Ensure the RGB wave correctly loops across the keyboard matrix.
