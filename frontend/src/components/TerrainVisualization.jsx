import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { Maximize2, Minimize2, MousePointerClick } from "lucide-react";

const RISK_COLOR = { LOW: "#34d399", MEDIUM: "#f59e0b", HIGH: "#f43f5e" };

function Terrain() {
  const geometry = useMemo(() => {
    const size = 40;
    const segments = 60;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Procedural conceptual terrain (layered sine noise) - NOT real elevation data.
      const h =
        Math.sin(x * 0.35) * 1.6 +
        Math.cos(y * 0.3) * 1.6 +
        Math.sin((x + y) * 0.18) * 2.2 +
        Math.cos(x * 0.6 - y * 0.4) * 0.8;
      pos.setZ(i, h);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2.4, 0, 0]}
      receiveShadow
      castShadow
    >
      <meshStandardMaterial color="#2f6b8a" wireframe={false} flatShading />
    </mesh>
  );
}

function RiskHotspot({ position, level, name, showLabel }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(clock.getElapsedTime() * 2.5 + position[0]) * 0.25;
    ref.current.scale.set(s, s, s);
  });
  return (
    <group position={position}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial
          color={RISK_COLOR[level]}
          emissive={RISK_COLOR[level]}
          emissiveIntensity={0.85}
        />
      </mesh>
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1, 6]} />
        <meshStandardMaterial color={RISK_COLOR[level]} />
      </mesh>
      {showLabel && (
        <Html distanceFactor={14} position={[0, 0.55, 0]} center occlude>
          <div className="pointer-events-none whitespace-nowrap rounded-md border border-white/10 bg-base-950/80 px-2 py-0.5 text-[10px] font-medium text-slate-200 backdrop-blur">
            {name}
          </div>
        </Html>
      )}
    </group>
  );
}

// 12 conceptual hotspots (mixed risk levels) across the terrain, each labeled
// with a real landslide-prone location name for context.
export const DEFAULT_HOTSPOTS = [
  { position: [-6, 3, 4], level: "HIGH", name: "Shimla, India" },
  { position: [3, 2.5, -5], level: "MEDIUM", name: "Darjeeling, India" },
  { position: [8, 1.8, 2], level: "LOW", name: "Munnar, India" },
  { position: [-2, 3.2, -8], level: "HIGH", name: "Gangtok, India" },
  { position: [-9, 2.2, -2], level: "MEDIUM", name: "Kathmandu, Nepal" },
  { position: [6, 2.6, 7], level: "HIGH", name: "Baguio City, Philippines" },
  { position: [0, 3.4, 1], level: "MEDIUM", name: "Mussoorie, India" },
  { position: [-4, 2.0, 8], level: "LOW", name: "Rio de Janeiro, Brazil" },
  { position: [10, 1.5, -6], level: "MEDIUM", name: "Chittagong, Bangladesh" },
  { position: [-8, 2.8, -6], level: "HIGH", name: "Itanagar, India" },
  { position: [4, 2.1, -1], level: "LOW", name: "Coorg, India" },
  { position: [1, 2.9, -9], level: "MEDIUM", name: "Wayanad, India" },
];

function Scene({ hotspots, showLabels, controlsActive }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 8]} intensity={1.1} castShadow />
      <fog attach="fog" args={["#0a0e14", 15, 45]} />
      <Terrain />
      {hotspots.map((h, i) => (
        <RiskHotspot
          key={i}
          position={h.position}
          level={h.level}
          name={h.name}
          showLabel={showLabels}
        />
      ))}
      <OrbitControls
        enabled={controlsActive}
        enablePan={false}
        minDistance={12}
        maxDistance={35}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate
        autoRotateSpeed={0.6}
      />
    </>
  );
}

export default function TerrainVisualization({
  hotspots = DEFAULT_HOTSPOTS,
  height = 360,
}) {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  // Controls start inactive so hovering/scrolling past this component on the
  // page scrolls the page normally. A click "activates" drag-to-rotate /
  // scroll-to-zoom. Deactivation happens only when the user clicks somewhere
  // OUTSIDE the component -- NOT on mouse-leave, because a fast drag
  // routinely (and momentarily) carries the cursor outside these bounds
  // mid-gesture, and deactivating right then would abort the drag and
  // immediately show the "click to interact" hint again.
  const [controlsActive, setControlsActive] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!controlsActive || isFullscreen) return;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setControlsActive(false);
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", handleOutsideClick);
  }, [controlsActive, isFullscreen]);

  const toggleFullscreen = async (e) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen?.();
      setControlsActive(true);
    } else {
      await document.exitFullscreen?.();
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ height: isFullscreen ? "100vh" : height }}
      className="relative overflow-hidden rounded-xl border border-base-700/60 bg-base-950"
      onClick={() => setControlsActive(true)}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 14, 22], fov: 45 }}
        onCreated={({ gl }) => {
          // Gracefully recover from WebGL context loss (can happen on GPU
          // throttling / low-memory devices / browser device-emulation modes)
          // instead of leaving the canvas permanently blank.
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
          });
        }}
      >
        <Scene
          hotspots={hotspots}
          showLabels={showLabels}
          controlsActive={controlsActive}
        />
      </Canvas>

      {!controlsActive && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-base-950/20">
          <div className="flex items-center gap-2 rounded-full border border-base-600 bg-base-900/80 px-4 py-2 text-xs font-medium text-slate-300 backdrop-blur">
            <MousePointerClick className="h-3.5 w-3.5" /> Click to interact
          </div>
        </div>
      )}

      <div className="absolute right-3 top-3 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowLabels((s) => !s);
          }}
          className="rounded-lg border border-base-600 bg-base-900/80 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 backdrop-blur transition-colors hover:bg-base-800"
          title="Toggle location labels"
        >
          {showLabels ? "Hide Labels" : "Show Labels"}
        </button>
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-1 rounded-lg border border-base-600 bg-base-900/80 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 backdrop-blur transition-colors hover:bg-base-800"
          title="Toggle fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
