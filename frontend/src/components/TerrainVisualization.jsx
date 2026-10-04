import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { Maximize2, Minimize2, MousePointerClick } from "lucide-react";

const RISK_COLOR = { LOW: "#34d399", MEDIUM: "#f59e0b", HIGH: "#f43f5e" };
const TERRAIN_TILT = -Math.PI / 2.4;

// Procedural conceptual terrain (layered sine noise) - NOT real elevation data.
function terrainHeight(x, y) {
  return (
    Math.sin(x * 0.35) * 1.6 +
    Math.cos(y * 0.3) * 1.6 +
    Math.sin((x + y) * 0.18) * 2.2 +
    Math.cos(x * 0.6 - y * 0.4) * 0.8
  );
}

// Terrain-plane coordinates (x, y) -> world position of the surface point,
// using the same rotation the terrain mesh gets, so markers sit exactly on it.
function surfaceToWorld(x, y, lift = 0.35) {
  const h = terrainHeight(x, y) + lift;
  const c = Math.cos(TERRAIN_TILT);
  const s = Math.sin(TERRAIN_TILT);
  return [x, y * c - h * s, y * s + h * c];
}

// Equirectangular projection of lat/lon onto the terrain plane (40 x 40).
function latLonToTerrain(lat, lon) {
  return [(lon / 180) * 17, (lat / 90) * 17];
}

function Terrain() {
  const geometry = useMemo(() => {
    const size = 40;
    const segments = 60;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, terrainHeight(pos.getX(i), pos.getY(i)));
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh
      geometry={geometry}
      rotation={[TERRAIN_TILT, 0, 0]}
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

// Many data points (hundreds) drawn with ONE instanced mesh so the page stays
// smooth. Each instance gets its own colour and a gentle pulse.
function PointCloud({ placed }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const color = new THREE.Color();
    placed.forEach((p, i) => {
      color.set(RISK_COLOR[p.level] || RISK_COLOR.LOW);
      mesh.setColorAt(i, color);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [placed]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.getElapsedTime();
    placed.forEach((p, i) => {
      const s = 1 + Math.sin(t * 2.2 + i * 0.7) * 0.2;
      dummy.position.set(p.world[0], p.world[1], p.world[2]);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!placed.length) return null;
  return (
    <instancedMesh
      key={placed.length}
      ref={meshRef}
      args={[null, null, placed.length]}
      frustumCulled={false}
    >
      <sphereGeometry args={[0.24, 12, 12]} />
      <meshStandardMaterial emissive="#ffffff" emissiveIntensity={0.35} />
    </instancedMesh>
  );
}

// 12 conceptual hotspots (mixed risk levels) across the terrain, each labeled
// with a real landslide-prone location name for context. Still used by the
// About page, which shows a purely illustrative terrain.
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

function Scene({ hotspots, placed, labelled, showLabels, controlsActive }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 8]} intensity={1.1} castShadow />
      <fog attach="fog" args={["#0a0e14", 15, 45]} />
      <Terrain />

      {placed ? (
        <>
          <PointCloud placed={placed} />
          {showLabels &&
            labelled.map((p) => (
              <group key={p.key} position={p.world}>
                <Html distanceFactor={14} position={[0, 0.55, 0]} center occlude>
                  <div className="pointer-events-none whitespace-nowrap rounded-md border border-white/10 bg-base-950/80 px-2 py-0.5 text-[10px] font-medium text-slate-200 backdrop-blur">
                    {p.name}
                  </div>
                </Html>
              </group>
            ))}
        </>
      ) : (
        hotspots.map((h, i) => (
          <RiskHotspot
            key={i}
            position={h.position}
            level={h.level}
            name={h.name}
            showLabel={showLabels}
          />
        ))
      )}

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

function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-3 rounded-lg border border-base-600 bg-base-900/80 px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur">
      {[
        ["#34d399", "Low"],
        ["#f59e0b", "Medium"],
        ["#f43f5e", "High"],
      ].map(([c, label]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: c }}
          />
          {label}
        </span>
      ))}
    </div>
  );
}

/**
 * Props:
 *  - points:  [{ latitude, longitude, level: "LOW"|"MEDIUM"|"HIGH", name }]
 *             Real data mode -- each point is placed on the terrain by its
 *             lat/lon (world map projected onto the terrain). When this prop is
 *             given (even as an empty array) the illustrative hotspots are NOT
 *             shown.
 *  - emptyMessage: text shown over the terrain when `points` is empty.
 *  - labelLimit: how many points (highest first) get a name label.
 *  - hotspots: legacy illustrative hotspots (About page only).
 */
export default function TerrainVisualization({
  points,
  emptyMessage = "No data points to show yet.",
  labelLimit = 12,
  hotspots = DEFAULT_HOTSPOTS,
  height = 360,
  className = "",
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

  const dataMode = Array.isArray(points);

  const placed = useMemo(() => {
    if (!dataMode) return null;
    return points
      .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
      .map((p, i) => {
        const [x, y] = latLonToTerrain(p.latitude, p.longitude);
        return {
          key: p.id ?? p.location_id ?? i,
          name: p.name,
          level: p.level || p.risk_level || "LOW",
          world: surfaceToWorld(x, y),
        };
      });
  }, [points, dataMode]);

  const labelled = useMemo(() => {
    if (!placed) return [];
    const rank = { HIGH: 2, MEDIUM: 1, LOW: 0 };
    return [...placed]
      .sort((a, b) => rank[b.level] - rank[a.level])
      .slice(0, labelLimit);
  }, [placed, labelLimit]);

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

  const isEmpty = dataMode && placed.length === 0;

  return (
    <div
      ref={containerRef}
      style={{ height: isFullscreen ? "100vh" : height }}
      className={`relative w-full overflow-hidden rounded-xl border border-base-700/60 bg-base-950 ${className}`}
      onClick={() => setControlsActive(true)}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
        resize={{ scroll: false }}
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
          placed={placed}
          labelled={labelled}
          showLabels={showLabels}
          controlsActive={controlsActive}
        />
      </Canvas>

      {dataMode && <Legend />}

      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
          <p className="max-w-sm rounded-xl border border-base-600 bg-base-900/85 px-4 py-3 text-center text-xs text-slate-300 backdrop-blur">
            {emptyMessage}
          </p>
        </div>
      )}

      {!controlsActive && !isEmpty && (
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
