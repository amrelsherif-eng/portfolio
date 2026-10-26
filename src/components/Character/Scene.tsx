import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useLoading } from "../../context/LoadingProvider";
import { setProgress } from "../Loading";
import { setCoreTimeline, setAllTimeline } from "../utils/GsapScroll";

// "Network core": a globe of nodes and links with packets travelling between them.
// Built in code (no model file), so it loads instantly.

const ACCENT = new THREE.Color("#00c8dc");
const ACCENT_2 = new THREE.Color("#00f0ff");
const NODE_COUNT = 140;
const RADIUS = 2.2;
const LINK_DIST = 1.05;
const PACKET_COUNT = 60;

function fibonacciSphere(n: number, r: number) {
  const pts: THREE.Vector3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const t = phi * i;
    // small jitter so it doesn't look too perfect
    const j = 1 + (Math.random() - 0.5) * 0.08;
    pts.push(new THREE.Vector3(Math.cos(t) * rad * r * j, y * r * j, Math.sin(t) * rad * r * j));
  }
  return pts;
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(255,255,255,0.6)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function buildCore() {
  const core = new THREE.Group();
  const sprite = glowTexture();

  // nodes
  const nodes = fibonacciSphere(NODE_COUNT, RADIUS);
  const nodeGeo = new THREE.BufferGeometry().setFromPoints(nodes);
  const nodeMat = new THREE.PointsMaterial({
    size: 0.13,
    map: sprite,
    color: ACCENT_2,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  core.add(new THREE.Points(nodeGeo, nodeMat));

  // links between nearby nodes
  const edges: [number, number][] = [];
  const linkPos: number[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let k = i + 1; k < nodes.length; k++) {
      if (nodes[i].distanceTo(nodes[k]) < LINK_DIST) {
        edges.push([i, k]);
        linkPos.push(...nodes[i].toArray(), ...nodes[k].toArray());
      }
    }
  }
  const linkGeo = new THREE.BufferGeometry();
  linkGeo.setAttribute("position", new THREE.Float32BufferAttribute(linkPos, 3));
  const linkMat = new THREE.LineBasicMaterial({
    color: ACCENT,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  core.add(new THREE.LineSegments(linkGeo, linkMat));

  // inner core glow
  const inner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(RADIUS * 0.55, 2),
    new THREE.MeshBasicMaterial({
      color: ACCENT,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  core.add(inner);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: sprite,
      color: ACCENT,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  halo.scale.setScalar(RADIUS * 2.6);
  core.add(halo);

  // packets travelling along links
  const packets = Array.from({ length: PACKET_COUNT }, () => ({
    edge: edges[Math.floor(Math.random() * edges.length)],
    t: Math.random(),
    speed: 0.35 + Math.random() * 0.6,
  }));
  const packetPos = new Float32Array(PACKET_COUNT * 3);
  const packetGeo = new THREE.BufferGeometry();
  packetGeo.setAttribute("position", new THREE.BufferAttribute(packetPos, 3));
  const packetMat = new THREE.PointsMaterial({
    size: 0.11,
    map: sprite,
    color: new THREE.Color("#ffb300"), // packets in amber
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  core.add(new THREE.Points(packetGeo, packetMat));

  // pick a connected next edge so packets "route" through the network
  const nextEdge = (from: number) => {
    const options = edges.filter((e) => e[0] === from || e[1] === from);
    const e = options[Math.floor(Math.random() * options.length)];
    return e[0] === from ? e : ([e[1], e[0]] as [number, number]);
  };

  const tmp = new THREE.Vector3();
  const update = (dt: number, time: number) => {
    packets.forEach((p, i) => {
      p.t += dt * p.speed;
      if (p.t >= 1) {
        p.t = 0;
        p.edge = nextEdge(p.edge[1]);
      }
      tmp.lerpVectors(nodes[p.edge[0]], nodes[p.edge[1]], p.t);
      packetPos.set([tmp.x, tmp.y, tmp.z], i * 3);
    });
    packetGeo.attributes.position.needsUpdate = true;
    inner.rotation.y = -time * 0.15;
    inner.rotation.x = time * 0.07;
    halo.material.opacity = 0.3 + Math.sin(time * 1.5) * 0.06;
  };

  return { core, update, materials: { nodeMat, linkMat, packetMat } };
}

const Scene = () => {
  const canvasDiv = useRef<HTMLDivElement | null>(null);
  const { setLoading } = useLoading();

  useEffect(() => {
    const div = canvasDiv.current;
    if (!div) return;
    const rect = div.getBoundingClientRect();

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: window.devicePixelRatio < 2,
      powerPreference: "high-performance",
    });
    renderer.setSize(rect.width, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    div.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(35, rect.width / rect.height, 0.1, 100);
    camera.position.set(0, 0, 11.5);

    const { core, update } = buildCore();
    const pivot = new THREE.Group(); // scroll animations act on this
    pivot.add(core);
    scene.add(pivot);

    const progress = setProgress((v) => setLoading(v));
    progress.loaded().then(() => {
      setCoreTimeline(pivot, camera);
      setAllTimeline();
    });

    let mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
    };
    document.addEventListener("mousemove", onMouseMove);

    const onResize = () => {
      const r = div.getBoundingClientRect();
      renderer.setSize(r.width, r.height);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const time = clock.elapsedTime;
      core.rotation.y += dt * 0.12;
      // tilt toward the mouse
      core.rotation.x = THREE.MathUtils.lerp(core.rotation.x, mouse.y * 0.35, 0.05);
      core.position.x = THREE.MathUtils.lerp(core.position.x, mouse.x * 0.15, 0.05);
      update(dt, time);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      scene.clear();
      renderer.dispose();
      div.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="character-container">
      <div className="character-model" ref={canvasDiv}>
        <div className="character-rim"></div>
      </div>
    </div>
  );
};

export default Scene;
