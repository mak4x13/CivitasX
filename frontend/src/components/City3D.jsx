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
    controls.enableZoom = false;
    controls.minPolarAngle = 0.58;
    controls.maxPolarAngle = 1.12;
    controls.minDistance = 22;
    controls.maxDistance = 56;
    controls.target.set(0, 0, 0);
    controls.update();

    function syncZoomState(event) {
      controls.enableZoom = event.shiftKey;
    }

    function resetZoomState() {
      controls.enableZoom = false;
    }

    window.addEventListener('keydown', syncZoomState);
    window.addEventListener('keyup', syncZoomState);
    window.addEventListener('blur', resetZoomState);

    return () => {
      window.removeEventListener('keydown', syncZoomState);
      window.removeEventListener('keyup', syncZoomState);
      window.removeEventListener('blur', resetZoomState);
      controls.dispose();
    };
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
  canvas.width = 620;
  canvas.height = 176;

  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(2, 6, 23, 0.82)';
  context.strokeStyle = 'rgba(255, 255, 255, 0.42)';
  context.lineWidth = 6;

  const radius = 32;
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

  context.font = '700 40px Space Grotesk, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#f8fafc';
  context.fillText(text, width / 2, height / 2 - 8);

  context.font = '600 18px Manrope, sans-serif';
  context.fillStyle = '#d4d4d8';
  context.fillText('DEPARTMENT', width / 2, height / 2 + 36);

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
    <sprite position={position} scale={[5.8, 1.7, 1]} renderOrder={20}>
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

      <DepartmentLabel text={zone.departmentName ?? zone.name} position={[0, 4.7, 0]} />

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

export default function City3D({
  zoneStates,
  metrics,
  activeZoneId,
  pulseZoneIds = [],
  onSelectZone,
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
    <div className="relative h-full overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_24%),linear-gradient(180deg,#030712_0%,#020617_58%,#010101_100%)] shadow-[0_20px_80px_rgba(2,6,23,0.55)]">
      <Canvas className="h-full w-full" shadows camera={{ position: [31, 28, 28], fov: 46 }}>
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={1.45} color="#ffffff" />
        <directionalLight position={[18, 28, 14]} intensity={4.3} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} color="#ffffff" />
        <directionalLight position={[-12, 18, -16]} intensity={1.45} color="#f8fafc" />
        <pointLight position={[-14, 10, -10]} intensity={1.45} color="#ffffff" />
        <pointLight position={[14, 8, 10]} intensity={1.25} color="#f8fafc" />
        <pointLight position={[0, 18, 0]} intensity={1.05} color="#ffffff" />
        <gridHelper args={[70, 70, '#d4d4d8', '#18181b']} position={[0, 0.03, 0]} />

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

      <div className="pointer-events-none absolute left-4 top-4 rounded-[22px] border border-white/10 bg-slate-950/72 px-4 py-3 text-xs text-slate-300 shadow-lg backdrop-blur-xl">
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-slate-400">3D City View</p>
        <p className="mt-2 text-sm font-semibold text-white">Drag to orbit and click a district to inspect it.</p>
        <p className="mt-2 text-xs leading-6 text-slate-400">Scroll moves the page. Hold Shift while scrolling to zoom the camera.</p>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-white/10 bg-slate-950/72 px-3 py-1.5 text-xs text-slate-200">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-300" />
          Stable
        </span>
        <span className="rounded-full border border-white/10 bg-slate-950/72 px-3 py-1.5 text-xs text-slate-200">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-300" />
          Watch
        </span>
        <span className="rounded-full border border-white/10 bg-slate-950/72 px-3 py-1.5 text-xs text-slate-200">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-orange-300" />
          Tense
        </span>
        <span className="rounded-full border border-white/10 bg-slate-950/72 px-3 py-1.5 text-xs text-slate-200">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-rose-300" />
          Critical
        </span>
      </div>
    </div>
  );
}
