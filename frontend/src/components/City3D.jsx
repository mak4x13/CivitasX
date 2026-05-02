import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls';
import { useEffect, useMemo, useRef, useState } from 'react';

function riskTone(riskBand) {
  if (riskBand === 'stable') {
    return '#0f766e';
  }

  if (riskBand === 'warning') {
    return '#d97706';
  }

  if (riskBand === 'tense') {
    return '#f97316';
  }

  return '#ef4444';
}

function buildRoutePath(route) {
  const segments = [];
  let totalLength = 0;

  for (let index = 0; index < route.length; index += 1) {
    const current = route[index];
    const next = route[(index + 1) % route.length];
    const dx = next[0] - current[0];
    const dy = next[1] - current[1];
    const dz = next[2] - current[2];
    const length = Math.hypot(dx, dy, dz);

    segments.push({ current, next, dx, dy, dz, length, start: totalLength });
    totalLength += length;
  }

  return { segments, totalLength };
}

function Vehicle({ routePath, speed, phase, color }) {
  const meshRef = useRef();
  const routePathRef = useRef(routePath);

  useEffect(() => {
    routePathRef.current = routePath;
  }, [routePath]);

  useFrame(({ clock }) => {
    if (!meshRef.current) {
      return;
    }

    const { segments, totalLength } = routePathRef.current;
    if (!segments.length || totalLength === 0) {
      return;
    }

    const progressDistance = ((clock.elapsedTime * speed + phase) % totalLength + totalLength) % totalLength;

    const segment =
      segments.find((entry) => progressDistance >= entry.start && progressDistance < entry.start + entry.length) ??
      segments[segments.length - 1];
    const localT = segment.length === 0 ? 0 : (progressDistance - segment.start) / segment.length;

    meshRef.current.position.set(
      segment.current[0] + segment.dx * localT,
      segment.current[1] + segment.dy * localT,
      segment.current[2] + segment.dz * localT,
    );

    meshRef.current.rotation.y = Math.atan2(segment.dx, segment.dz);
  });

  return (
    <mesh ref={meshRef} castShadow>
      <boxGeometry args={[0.75, 0.45, 1.3]} />
      <meshStandardMaterial color={color} metalness={0.08} roughness={0.56} emissive={color} emissiveIntensity={0.06} />
    </mesh>
  );
}

function CameraControls() {
  const { camera, gl } = useThree();
  const controls = useMemo(() => new OrbitControlsImpl(camera, gl.domElement), [camera, gl.domElement]);

  useEffect(() => {
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minPolarAngle = 0.58;
    controls.maxPolarAngle = 1.12;
    controls.minDistance = 22;
    controls.maxDistance = 48;
    controls.target.set(0, 0, 0);
    controls.update();

    return () => controls.dispose();
  }, [controls]);

  useFrame(() => {
    controls.update();
  });

  return null;
}

function MarkerCluster({ zone, type, count, color, offsetY }) {
  if (count === 0) {
    return null;
  }

  return (
    <group position={[zone.position[0], offsetY, zone.position[2]]}>
      {Array.from({ length: count }).map((_, index) => {
        const spread = type === 'protest' ? 1.8 : 1.2;
        const x = Math.cos(index * 1.7) * spread;
        const z = Math.sin(index * 1.7) * spread;
        return (
          <mesh key={`${type}-${zone.id}-${index}`} position={[x, 0, z]} castShadow>
            <sphereGeometry args={[type === 'protest' ? 0.22 : 0.2, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.08} roughness={0.45} />
          </mesh>
        );
      })}
    </group>
  );
}

function PulseHalo({ size, color, active }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (!meshRef.current || !active) {
      return;
    }

    const pulse = 0.18 + Math.sin(clock.elapsedTime * 3.2) * 0.08;
    meshRef.current.material.opacity = pulse;
    meshRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.6) * 0.03);
  });

  if (!active) {
    return null;
  }

  return (
    <mesh ref={meshRef} position={[0, 0.24, 0]} rotation-x={-Math.PI / 2}>
      <ringGeometry args={[Math.max(size[0], size[1]) * 0.48, Math.max(size[0], size[1]) * 0.58, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.22} side={2} />
    </mesh>
  );
}

function createLabelTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 220;

  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(2, 6, 23, 0.82)';
  context.strokeStyle = 'rgba(255, 255, 255, 0.42)';
  context.lineWidth = 8;

  const radius = 42;
  const width = canvas.width;
  const height = canvas.height;
  context.beginPath();
  context.moveTo(radius, 0);
  context.lineTo(width - radius, 0);
  context.quadraticCurveTo(width, 0, width, radius);
  context.lineTo(width, height - radius);
  context.quadraticCurveTo(width, height, width - radius, height);
  context.lineTo(radius, height);
  context.quadraticCurveTo(0, height, 0, height - radius);
  context.lineTo(0, radius);
  context.quadraticCurveTo(0, 0, radius, 0);
  context.closePath();
  context.fill();
  context.stroke();

  context.font = '700 54px Inter, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#f8fafc';
  context.fillText(text, width / 2, height / 2 - 10);

  context.font = '500 24px Inter, sans-serif';
  context.fillStyle = '#d4d4d8';
  context.fillText('DEPARTMENT', width / 2, height / 2 + 48);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function DepartmentLabel({ text, position }) {
  const texture = useMemo(() => createLabelTexture(text), [text]);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  if (!texture) {
    return null;
  }

  return (
    <sprite position={position} scale={[7.2, 2.1, 1]} renderOrder={20}>
      <spriteMaterial map={texture} transparent depthWrite={false} depthTest={false} />
    </sprite>
  );
}

function ZoneFrame({ zone, highlighted }) {
  const [width, depth] = zone.size;
  const frameColor = highlighted ? '#f8fafc' : '#9ca3af';
  const outerOpacity = highlighted ? 0.32 : 0.18;
  const innerOpacity = highlighted ? 0.2 : 0.08;
  const thickness = 0.18;
  const height = 0.05;

  return (
    <group position={[0, 0.24, 0]}>
      <mesh position={[0, 0, depth / 2 + thickness / 2]}>
        <boxGeometry args={[width + thickness * 2, height, thickness]} />
        <meshBasicMaterial color={frameColor} transparent opacity={outerOpacity} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, -depth / 2 - thickness / 2]}>
        <boxGeometry args={[width + thickness * 2, height, thickness]} />
        <meshBasicMaterial color={frameColor} transparent opacity={outerOpacity} depthWrite={false} />
      </mesh>
      <mesh position={[width / 2 + thickness / 2, 0, 0]}>
        <boxGeometry args={[thickness, height, depth]} />
        <meshBasicMaterial color={frameColor} transparent opacity={outerOpacity} depthWrite={false} />
      </mesh>
      <mesh position={[-width / 2 - thickness / 2, 0, 0]}>
        <boxGeometry args={[thickness, height, depth]} />
        <meshBasicMaterial color={frameColor} transparent opacity={outerOpacity} depthWrite={false} />
      </mesh>

      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[width + 0.3, 0.03, depth + 0.3]} />
        <meshBasicMaterial color={frameColor} transparent opacity={innerOpacity} depthWrite={false} />
      </mesh>
    </group>
  );
}

function BuildingOutline({ width, height, depth, highlighted }) {
  const outlineColor = highlighted ? '#ffffff' : '#bdbdbd';
  return (
    <mesh>
      <boxGeometry args={[width + 0.1, height + 0.1, depth + 0.1]} />
      <meshBasicMaterial color={outlineColor} wireframe transparent opacity={highlighted ? 0.55 : 0.25} />
    </mesh>
  );
}

function StreetLight({ position, color }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 1.6, 10]} />
        <meshStandardMaterial color="#222222" metalness={0.45} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.65, 0]} castShadow>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} roughness={0.12} />
      </mesh>
      <pointLight position={[0, 1.6, 0]} intensity={0.45} distance={7} color={color} />
    </group>
  );
}

function ZoneBlock({ zone, isHovered, isSelected, isPlaybackActive, onSelect, onHover }) {
  const tone = riskTone(zone.riskBand);
  const elevated = isHovered || isSelected || isPlaybackActive;
  const glowOpacity = elevated ? 0.35 : 0.2;

  return (
    <group
      position={zone.position}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(zone);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(zone.id);
      }}
      onPointerOut={() => onHover(null)}
    >
      <ZoneFrame zone={zone} highlighted={elevated} />

      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={zone.size} />
        <meshStandardMaterial color="#141414" transparent opacity={0.82} roughness={1} metalness={0.02} />
      </mesh>

      <mesh position={[0, 0.06, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[zone.size[0] - 0.5, zone.size[1] - 0.5]} />
        <meshStandardMaterial
          color={tone}
          transparent
          opacity={elevated ? 0.44 : 0.24}
          emissive={tone}
          emissiveIntensity={elevated ? 0.3 : 0.16}
        />
      </mesh>

      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[zone.size[0] - 0.25, 0.06, zone.size[1] - 0.25]} />
        <meshStandardMaterial color={tone} transparent opacity={glowOpacity} emissive={tone} emissiveIntensity={0.18} />
      </mesh>

      <mesh position={[0, 0.21, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[Math.max(zone.size[0], zone.size[1]) * 0.42, Math.max(zone.size[0], zone.size[1]) * 0.48, 32]} />
        <meshBasicMaterial color={tone} transparent opacity={elevated ? 0.32 : 0.12} side={2} />
      </mesh>

      <PulseHalo size={zone.size} color={tone} active={isPlaybackActive} />

      {Array.from({ length: zone.buildingCount }).map((_, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        const x = -2.9 + col * 2.9 + (index % 2 === 0 ? -0.4 : 0.4);
        const z = -1.4 + row * 2.4;
        const height = 1.8 + ((zone.stabilityScore + index * 7) % 6) * 0.35;
        const windowRows = Math.max(2, Math.floor(height * 1.8));
        return (
          <group key={`${zone.id}-building-${index}`} position={[x, height / 2 + 0.2, z]}>
            <BuildingOutline width={1.45} height={height} depth={1.45} highlighted={elevated} />
            <mesh castShadow>
              <boxGeometry args={[1.45, height, 1.45]} />
              <meshPhysicalMaterial
                color="#1f1f1f"
                emissive={elevated ? '#27272a' : '#111111'}
                emissiveIntensity={0.04}
                roughness={0.78}
                metalness={0.08}
                clearcoat={0.02}
                clearcoatRoughness={0.92}
              />
            </mesh>
            <mesh position={[0, height / 2 + 0.05, 0]} castShadow>
              <boxGeometry args={[1.52, 0.14, 1.52]} />
              <meshStandardMaterial color="#2b2b2b" emissive={tone} emissiveIntensity={0.1} roughness={0.5} />
            </mesh>
            {Array.from({ length: windowRows }).map((_, windowIndex) => {
              const offsetY = -height / 2 + 0.42 + windowIndex * 0.42;
              const lit = (windowIndex + index) % 2 === 0;
              return (
                <mesh key={`${zone.id}-window-${index}-${windowIndex}`} position={[0.74, offsetY, 0]}>
                  <boxGeometry args={[0.06, 0.18, 0.14]} />
                  <meshStandardMaterial
                    color={lit ? '#fafafa' : '#1a1a1a'}
                    emissive={lit ? '#ffffff' : '#000000'}
                    emissiveIntensity={lit ? 1.2 : 0}
                    transparent
                    opacity={lit ? 0.96 : 0.35}
                  />
                </mesh>
              );
            })}
          </group>
        );
      })}

      <DepartmentLabel text={zone.departmentName ?? zone.name} position={[0, 5.1, 0]} />

      <MarkerCluster zone={zone} type="traffic" count={zone.trafficMarkers} color="#fbbf24" offsetY={0.34} />
      <MarkerCluster zone={zone} type="protest" count={zone.protestMarkers} color="#fb7185" offsetY={0.56} />
      <MarkerCluster zone={zone} type="police" count={zone.policeMarkers} color="#93c5fd" offsetY={0.82} />
    </group>
  );
}

function RoadNetwork() {
  return (
    <group>
      <mesh position={[0, -0.04, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[58, 32]} />
        <meshStandardMaterial color="#101010" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[58, 5.2]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.92} metalness={0.01} emissive="#161616" emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[5.2, 32]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.92} metalness={0.01} emissive="#161616" emissiveIntensity={0.12} />
      </mesh>
      {[-12, 0, 12].map((x) => (
        <mesh key={`stripe-x-${x}`} position={[x, 0.03, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.18, 32]} />
          <meshStandardMaterial color="#d4d4d8" transparent opacity={0.3} emissive="#ffffff" emissiveIntensity={0.06} />
        </mesh>
      ))}
      {[-10, 0, 10].map((z) => (
        <mesh key={`stripe-z-${z}`} position={[0, 0.03, z]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[58, 0.18]} />
          <meshStandardMaterial color="#d4d4d8" transparent opacity={0.3} emissive="#ffffff" emissiveIntensity={0.06} />
        </mesh>
      ))}
    </group>
  );
}

function buildTrafficLanes() {
  return [
    [
      [-24, 0.35, -0.9],
      [24, 0.35, -0.9],
    ],
    [
      [24, 0.35, 0],
      [-24, 0.35, 0],
    ],
    [
      [-24, 0.35, 0.9],
      [24, 0.35, 0.9],
    ],
    [
      [-12.6, 0.35, -14],
      [-12.6, 0.35, 14],
    ],
    [
      [-12, 0.35, 14],
      [-12, 0.35, -14],
    ],
    [
      [-11.4, 0.35, -14],
      [-11.4, 0.35, 14],
    ],
    [
      [11.4, 0.35, 14],
      [11.4, 0.35, -14],
    ],
    [
      [12, 0.35, -14],
      [12, 0.35, 14],
    ],
    [
      [12.6, 0.35, 14],
      [12.6, 0.35, -14],
    ],
  ];
}

function CityVehicles({ trafficLevel }) {
  const count = Math.min(8, 4 + Math.round(trafficLevel / 18));
  const speed = Math.max(0.045, 0.13 - trafficLevel * 0.0003);
  const clusteredRoutes = useMemo(() => buildTrafficLanes(), []);
  const routePaths = useMemo(() => {
    return Array.from({ length: count }).map((_, index) => {
      const routeIndex = index % clusteredRoutes.length;
      const route = clusteredRoutes[routeIndex];
      const offsetPattern = [0, -0.45, 0.45];
      const laneOffset = offsetPattern[index % offsetPattern.length] * (trafficLevel > 55 ? 0.82 : 0.7);

      const adjustedRoute = route.map(([x, y, z]) => {
        if (routeIndex < 3) {
          return [x, y, z + laneOffset];
        }

        return [x + laneOffset, y, z];
      });

      return buildRoutePath(adjustedRoute);
    });
  }, [clusteredRoutes, count, trafficLevel]);

  return (
    <group>
      {routePaths.map((routePath, index) => {
        const color = '#9ca3af';
        const phase = (routePath.totalLength / count) * index;
        return <Vehicle key={`vehicle-${index}`} routePath={routePath} speed={speed + index * 0.004} phase={phase} color={color} />;
      })}
    </group>
  );
}

function CityOverlayMap({ zoneStates, metrics, activeZoneId, hoveredZoneId, onClose }) {
  const width = 1100;
  const height = 720;
  const scale = 18;

  const toX = (x) => width / 2 + x * scale;
  const toY = (z) => height / 2 - z * scale;

  return (
    <div className="pointer-events-auto absolute inset-4 z-20 overflow-hidden rounded-[24px] border border-white/10 bg-black/82 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">City Outline</p>
          <p className="text-xs text-slate-200">Zone-level stress map</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:bg-white/10"
        >
          Close
        </button>
      </div>

      <div className="h-[calc(100%-56px)] w-full p-2 sm:p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
          <defs>
            <linearGradient id="roadGlow" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#737373" stopOpacity="0.12" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width={width} height={height} fill="rgba(2,2,2,0.75)" rx="22" />

          <line x1="50" y1={height / 2} x2={width - 50} y2={height / 2} stroke="url(#roadGlow)" strokeWidth="28" strokeLinecap="round" />
          <line x1={width / 2} y1="50" x2={width / 2} y2={height - 50} stroke="url(#roadGlow)" strokeWidth="28" strokeLinecap="round" />

          {zoneStates.map((zone) => {
            const x = toX(zone.position[0]);
            const y = toY(zone.position[2]);
            const zoneWidth = zone.size[0] * scale;
            const zoneHeight = zone.size[1] * scale;
            const highlighted = zone.id === activeZoneId || zone.id === hoveredZoneId;
            const stroke = highlighted ? '#ffffff' : '#cbd5e1';
            const fillOpacity = highlighted ? 0.32 : 0.18;
            const tone = riskTone(zone.riskBand);

            return (
              <g key={zone.id}>
                <rect
                  x={x - zoneWidth / 2}
                  y={y - zoneHeight / 2}
                  width={zoneWidth}
                  height={zoneHeight}
                  rx="18"
                  fill={tone}
                  fillOpacity={fillOpacity}
                  stroke={stroke}
                  strokeWidth={highlighted ? 4 : 2}
                />
                <text x={x} y={y - zoneHeight / 2 + 24} textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="700" letterSpacing="0.14em">
                  {zone.name.toUpperCase()}
                </text>
                <text x={x} y={y + zoneHeight / 2 - 18} textAnchor="middle" fill="#d4d4d8" fontSize="11">
                  {zone.stabilityScore}/100
                </text>
              </g>
            );
          })}

          <text x="28" y="38" fill="#f8fafc" fontSize="18" fontWeight="700" letterSpacing="0.3em">
            CITY GRID
          </text>
          <text x="28" y="62" fill="#d4d4d8" fontSize="11" fontWeight="500" letterSpacing="0.2em">
            backend-driven zone stress map
          </text>

          <text x={width - 28} y="38" textAnchor="end" fill="#f8fafc" fontSize="16" fontWeight="700" letterSpacing="0.22em">
            STABILITY {metrics.stabilityScore}/100
          </text>
        </svg>
      </div>
    </div>
  );
}

export default function City3D({
  zoneStates,
  metrics,
  activeZoneId,
  pulseZoneIds = [],
  playbackStage,
  onSelectZone,
  showOverlay = true,
  onCloseOverlay,
}) {
  const [hoveredZoneId, setHoveredZoneId] = useState(null);
  const lights = [
    [-22, 0, -12, '#f4f4f5'],
    [-16, 0, -4, '#d4d4d8'],
    [-10, 0, 10, '#e5e7eb'],
    [-2, 0, -11, '#a1a1aa'],
    [6, 0, 8, '#e5e7eb'],
    [14, 0, -3, '#d4d4d8'],
    [22, 0, 11, '#f4f4f5'],
  ];

  return (
    <div className="relative h-full min-h-[620px] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/60 shadow-[0_20px_80px_rgba(2,6,23,0.55)]">
      <Canvas shadows camera={{ position: [28, 26, 24], fov: 42 }}>
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={1.45} color="#ffffff" />
        <directionalLight position={[18, 28, 14]} intensity={4.3} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} color="#ffffff" />
        <directionalLight position={[-12, 18, -16]} intensity={1.45} color="#f8fafc" />
        <pointLight position={[-14, 10, -10]} intensity={1.45} color="#ffffff" />
        <pointLight position={[14, 8, 10]} intensity={1.25} color="#f8fafc" />
        <pointLight position={[0, 18, 0]} intensity={1.05} color="#ffffff" />
        <gridHelper args={[70, 70, '#f8fafc', '#262626']} position={[0, 0.03, 0]} />

        <RoadNetwork />
        <CityVehicles trafficLevel={metrics.trafficLevel} />

        {lights.map(([x, y, z, color]) => (
          <StreetLight key={`${x}-${z}`} position={[x, y, z]} color={color} />
        ))}

        {zoneStates.map((zone) => (
          <ZoneBlock
            key={zone.id}
            zone={zone}
            isHovered={hoveredZoneId === zone.id}
            isSelected={activeZoneId === zone.id}
            isPlaybackActive={pulseZoneIds.includes(zone.id)}
            onSelect={onSelectZone}
            onHover={setHoveredZoneId}
          />
        ))}

        <mesh position={[0, 0.04, 0]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[58, 32]} />
          <meshStandardMaterial color="#090909" transparent opacity={0.14} emissive="#111111" emissiveIntensity={0.08} />
        </mesh>

        <CameraControls />
      </Canvas>

      {showOverlay ? (
        <CityOverlayMap
          zoneStates={zoneStates}
          metrics={metrics}
          activeZoneId={activeZoneId}
          hoveredZoneId={hoveredZoneId}
          onClose={onCloseOverlay}
        />
      ) : null}

      <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-300 shadow-lg backdrop-blur-xl">
        <span className="font-semibold text-white">View:</span> orbit, zoom, and inspect district-level simulation effects.
        <span className="mt-1 block text-[0.7rem] text-slate-400">
          Traffic, protest, and police markers respond to the backend payload.
        </span>
      </div>

      {playbackStage ? (
        <div className="pointer-events-none absolute right-4 top-4 max-w-[340px] rounded-2xl border border-cyan-400/14 bg-slate-950/78 px-4 py-3 text-xs text-slate-300 shadow-lg backdrop-blur-xl">
          <p className="uppercase tracking-[0.22em] text-cyan-300/75">Active Ripple Stage</p>
          <p className="mt-2 text-sm font-semibold text-white">{playbackStage.title}</p>
          <p className="mt-2 leading-6 text-slate-300">{playbackStage.detail}</p>
        </div>
      ) : null}
    </div>
  );
}
