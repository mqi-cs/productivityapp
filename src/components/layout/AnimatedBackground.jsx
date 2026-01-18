import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

const vertexShader = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    vec3 pos = position;
    // Organic wave movement
    pos.y += sin(pos.x * 4.0 + time * 0.5) * 0.1 * intensity;
    pos.x += cos(pos.y * 3.0 + time * 0.3) * 0.1 * intensity;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform vec3 color1;
  uniform vec3 color2;
  uniform vec3 color3; 
  varying vec2 vUv;
  
  // Simplex noise function (simplified)
  float random (in vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  float noise (in vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = vUv;
    
    // Slow moving noise layers
    float n1 = noise(uv * 3.0 + time * 0.1);
    float n2 = noise(uv * 6.0 - time * 0.2);
    
    // Liquid pattern mixing
    float pattern = sin(uv.x * 10.0 + n1 * 5.0 + time) * cos(uv.y * 8.0 + n2 * 5.0 + time);
    
    // Smooth stepping for soft blobs
    float blob = smoothstep(-0.5, 0.8, pattern);
    
    // Color mixing
    vec3 mixedColor = mix(color1, color2, blob);
    // Add third accent color at peaks
    mixedColor = mix(mixedColor, color3, pow(blob, 3.0) * 0.6);
    
    // Dark vignetting
    float dist = length(uv - 0.5);
    float vignette = 1.0 - smoothstep(0.3, 1.5, dist);
    
    gl_FragColor = vec4(mixedColor * vignette, 1.0);
  }
`

function LiquidPlane() {
    const mesh = useRef(null)

    const uniforms = useMemo(
        () => ({
            time: { value: 0 },
            intensity: { value: 1.0 },
            color1: { value: new THREE.Color("#05070a") }, // Deep Black/Blue
            color2: { value: new THREE.Color("#1a1d2d") }, // Dark Indigo
            color3: { value: new THREE.Color("#00bcd4") }, // Neon Cyan (Accent)
        }),
        []
    )

    useFrame((state) => {
        if (mesh.current) {
            uniforms.time.value = state.clock.elapsedTime
            // Subtle pulsing intensity
            uniforms.intensity.value = 1.0 + Math.sin(state.clock.elapsedTime * 0.5) * 0.2
        }
    })

    return (
        <mesh ref={mesh} position={[0, 0, 0]}>
            <planeGeometry args={[16, 9, 64, 64]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                transparent={false}
            />
        </mesh>
    )
}

export default function AnimatedBackground() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 2] }}>
                <LiquidPlane />
            </Canvas>
        </div>
    )
}
