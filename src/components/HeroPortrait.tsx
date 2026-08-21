"use client";

import Link from "next/link";
import { ArrowUpRight, Gamepad2 } from "lucide-react";
import { PointerEvent, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type GazeTarget = {
  x: number;
  y: number;
};

const RESTING_GAZE: GazeTarget = { x: 0, y: 0 };

function makeIris() {
  const iris = new THREE.Group();
  const irisSurface = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 18, 14),
    new THREE.MeshPhysicalMaterial({ color: 0x726344, roughness: 0.36, metalness: 0.03, clearcoat: 0.36 })
  );
  irisSurface.scale.z = 0.3;
  iris.add(irisSurface);

  const pupil = new THREE.Mesh(
    new THREE.SphereGeometry(0.008, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x120f0c, roughness: 0.28 })
  );
  pupil.scale.z = 0.25;
  pupil.position.z = 0.005;
  iris.add(pupil);

  const glint = new THREE.Mesh(
    new THREE.SphereGeometry(0.003, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  glint.position.set(-0.004, 0.004, 0.008);
  iris.add(glint);

  return iris;
}

export default function HeroPortrait() {
  const frameRef = useRef<HTMLElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const gazeTarget = useRef<GazeTarget>(RESTING_GAZE);
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    const canvasHost = canvasHostRef.current;
    if (!canvasHost) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(23, 1, 0.1, 100);
    camera.position.set(0, 0.04, 6.6);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    canvasHost.replaceChildren(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xf7ead8, 0x111927, 2.2));

    const keyLight = new THREE.DirectionalLight(0xfff0db, 3.8);
    keyLight.position.set(-3.8, 3.2, 4.7);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xe5a85b, 4.6);
    rimLight.position.set(4, 1.2, 3.4);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0x7b9bc0, 1.6, 7);
    fillLight.position.set(-2.3, -0.4, 2.5);
    scene.add(fillLight);

    const avatarGroup = new THREE.Group();
    avatarGroup.position.set(0.92, 0.05, 0);
    scene.add(avatarGroup);

    let headBone: THREE.Bone | null = null;
    let headRestQuaternion: THREE.Quaternion | null = null;
    let leftIris: THREE.Group | null = null;
    let rightIris: THREE.Group | null = null;
    let animationFrame = 0;
    let isDisposed = false;

    const loader = new GLTFLoader();
    loader.load(
      "/models/nisheta-friend-avatar.glb",
      (gltf) => {
        if (isDisposed) return;

        const model = gltf.scene;
        model.scale.setScalar(3.8);
        model.updateMatrixWorld(true);

        model.traverse((node) => {
          node.frustumCulled = false;
          if (node instanceof THREE.Bone && node.name === "Head") {
            headBone = node;
          }
        });

        if (headBone) {
          const headWorldPosition = new THREE.Vector3();
          headBone.getWorldPosition(headWorldPosition);
          model.position.sub(headWorldPosition);
          model.position.y -= 0.04;
          headRestQuaternion = headBone.quaternion.clone();

          const gazeGroup = new THREE.Group();
          headBone.add(gazeGroup);
          leftIris = makeIris();
          rightIris = makeIris();
          leftIris.position.set(-0.043, 0.065, 0.096);
          rightIris.position.set(0.043, 0.065, 0.096);
          gazeGroup.add(leftIris, rightIris);
        }

        avatarGroup.add(model);
        setModelReady(true);
      },
      undefined,
      () => {
        if (!isDisposed) setModelReady(false);
      }
    );

    const resize = () => {
      const width = Math.max(canvasHost.clientWidth, 1);
      const height = Math.max(canvasHost.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvasHost);
    resize();

    const animate = () => {
      if (isDisposed) return;
      const target = reducedMotion ? RESTING_GAZE : gazeTarget.current;
      const headYaw = THREE.MathUtils.clamp(target.x * 0.48, -0.48, 0.48);
      const headPitch = THREE.MathUtils.clamp(target.y * -0.26, -0.26, 0.26);
      const irisYaw = THREE.MathUtils.clamp(target.x * 0.22, -0.22, 0.22);
      const irisPitch = THREE.MathUtils.clamp(target.y * -0.14, -0.14, 0.14);

      if (headBone && headRestQuaternion) {
        const offset = new THREE.Quaternion().setFromEuler(new THREE.Euler(headPitch, headYaw, 0, "YXZ"));
        const targetQuaternion = headRestQuaternion.clone().multiply(offset);
        headBone.quaternion.slerp(targetQuaternion, 0.1);
      }

      for (const iris of [leftIris, rightIris]) {
        if (!iris) continue;
        iris.rotation.y = THREE.MathUtils.damp(iris.rotation.y, irisYaw, 13, 1 / 60);
        iris.rotation.x = THREE.MathUtils.damp(iris.rotation.x, irisPitch, 13, 1 / 60);
      }

      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      scene.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          const material = node.material;
          if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
          else material.dispose();
        }
      });
      renderer.dispose();
      canvasHost.replaceChildren();
    };
  }, []);

  const updateGaze = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    const frame = frameRef.current;
    if (!frame) return;
    const bounds = frame.getBoundingClientRect();
    gazeTarget.current = {
      x: THREE.MathUtils.clamp(((event.clientX - bounds.left) / bounds.width - 0.5) * 2, -1, 1),
      y: THREE.MathUtils.clamp(((event.clientY - bounds.top) / bounds.height - 0.5) * 2, -1, 1),
    };
  };

  return (
    <article
      ref={frameRef}
      onPointerMove={updateGaze}
      onPointerLeave={() => { gazeTarget.current = RESTING_GAZE; }}
      className="surface-dark relative min-h-[340px] overflow-hidden p-7 sm:min-h-[370px] sm:p-9 xl:min-h-[390px]"
    >
      <h1 className="sr-only">NISHETA eSPORTS HUB</h1>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_43%,rgba(229,180,109,0.18),transparent_25%),radial-gradient(circle_at_74%_65%,rgba(93,123,157,0.12),transparent_32%),linear-gradient(90deg,rgba(20,25,31,0.99)_0%,rgba(20,25,31,0.88)_44%,rgba(20,25,31,0.14)_75%,rgba(20,25,31,0.34)_100%)]" />
      <div ref={canvasHostRef} className="pointer-events-none absolute -right-[11%] -top-[2%] h-[115%] w-[75%] min-w-[360px] sm:-right-[5%] sm:w-[68%] xl:right-0 xl:w-[62%]" aria-hidden="true" />
      <img
        src="/hero-nisheta-portrait.png"
        alt=""
        className={`pointer-events-none absolute -right-[14%] -top-[10%] h-[122%] w-[75%] min-w-[330px] object-cover object-[58%_30%] transition-opacity duration-500 sm:-right-[5%] sm:w-[66%] xl:right-0 xl:w-[59%] ${modelReady ? "opacity-0" : "opacity-85"}`}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#12171d] to-transparent" />

      <div className="relative z-10 flex h-full min-h-[284px] max-w-[20rem] flex-col justify-between sm:min-h-[298px]">
        <div>
          <div className="mb-6 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e5b46d]" />
            NISHETA eSPORTS HUB
          </div>
          <p className="max-w-[15rem] text-sm leading-6 text-white/65 sm:text-[15px]">
            Свой игровой хаб для быстрых сборов, живой команды и честной статистики.
          </p>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e5b46d]/90">
            Голова и взгляд следят за курсором.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/play" className="inline-flex items-center gap-2 rounded-xl bg-paper px-4 py-2.5 text-xs font-semibold text-graphite transition-transform hover:-translate-y-px">
            <Gamepad2 size={15} strokeWidth={1.9} />
            Собрать игру
          </Link>
          <Link href="/players" className="inline-flex items-center gap-2 px-2 py-2 text-xs font-semibold text-white/65 transition-colors hover:text-paper">
            Смотреть состав <ArrowUpRight size={15} strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </article>
  );
}
