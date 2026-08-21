"use client";

import Link from "next/link";
import { ArrowUpRight, Gamepad2 } from "lucide-react";
import { PointerEvent, useEffect, useRef, useState } from "react";
import * as THREE from "three";

type GazeTarget = {
  x: number;
  y: number;
};

const RESTING_GAZE: GazeTarget = { x: 0, y: 0 };

function makeEye() {
  const eye = new THREE.Group();
  const eyeWhite = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 24, 18),
    new THREE.MeshPhysicalMaterial({ color: 0xf3f0eb, roughness: 0.24, metalness: 0.02 })
  );
  eyeWhite.scale.set(1, 1, 0.66);
  eye.add(eyeWhite);

  const iris = new THREE.Mesh(
    new THREE.SphereGeometry(0.072, 20, 16),
    new THREE.MeshStandardMaterial({ color: 0x827452, roughness: 0.42, metalness: 0.05 })
  );
  iris.scale.set(1, 1, 0.26);
  iris.position.z = 0.108;
  eye.add(iris);

  const pupil = new THREE.Mesh(
    new THREE.SphereGeometry(0.034, 18, 14),
    new THREE.MeshStandardMaterial({ color: 0x12100d, roughness: 0.3 })
  );
  pupil.scale.set(1, 1, 0.22);
  pupil.position.z = 0.126;
  eye.add(pupil);

  const glint = new THREE.Mesh(
    new THREE.SphereGeometry(0.012, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  glint.position.set(-0.018, 0.022, 0.138);
  eye.add(glint);

  return eye;
}

function makeEyebrow() {
  const eyebrow = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.042, 0.34, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0x3e2d24, roughness: 0.92 })
  );
  eyebrow.rotation.z = Math.PI / 2;
  eyebrow.scale.set(1, 0.7, 0.52);
  return eyebrow;
}

export default function HeroPortrait() {
  const frameRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const gazeTarget = useRef<GazeTarget>(RESTING_GAZE);
  const [webglReady, setWebglReady] = useState(false);

  useEffect(() => {
    const canvasHost = canvasRef.current;
    if (!canvasHost) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrame = 0;
    let disposed = false;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-3, 3, 2.1, -2.1, 0.1, 100);
    camera.position.set(0, 0.08, 7);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    canvasHost.replaceChildren(renderer.domElement);

    const ambient = new THREE.HemisphereLight(0xf0e7d8, 0x0b0e15, 2.7);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffefdc, 4.2);
    keyLight.position.set(-3.2, 2.7, 4.5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xe5a85b, 5.4);
    rimLight.position.set(3.5, 1.2, 3.4);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0x83a3c6, 2.1, 8);
    fillLight.position.set(-2.6, -0.6, 3);
    scene.add(fillLight);

    const avatar = new THREE.Group();
    avatar.position.set(1.03, -0.24, 0);
    scene.add(avatar);

    const skinMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd3a083,
      roughness: 0.74,
      metalness: 0.01,
      clearcoat: 0.04,
      clearcoatRoughness: 0.75,
    });

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load("/hero-nisheta-portrait-front.png", (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      skinMaterial.map = texture;
      skinMaterial.needsUpdate = true;
    });

    const head = new THREE.Mesh(new THREE.SphereGeometry(1.16, 64, 52), skinMaterial);
    head.scale.set(0.87, 1.12, 0.88);
    head.rotation.y = Math.PI;
    head.position.y = 0.28;
    avatar.add(head);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.54, 0.9, 36), skinMaterial);
    neck.position.set(0, -1.16, -0.02);
    avatar.add(neck);

    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), skinMaterial);
    shoulder.scale.set(1.48, 0.34, 0.56);
    shoulder.position.set(0, -1.68, -0.16);
    avatar.add(shoulder);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 18), skinMaterial);
    nose.scale.set(0.7, 1.25, 1.08);
    nose.position.set(0, 0.15, 1.0);
    avatar.add(nose);

    const leftEar = new THREE.Mesh(new THREE.SphereGeometry(0.21, 20, 18), skinMaterial);
    leftEar.scale.set(0.52, 1, 0.56);
    leftEar.position.set(-0.94, 0.2, 0.08);
    avatar.add(leftEar);

    const rightEar = leftEar.clone();
    rightEar.position.x = 0.94;
    avatar.add(rightEar);

    const mouthCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.28, -0.47, 1.005),
      new THREE.Vector3(-0.11, -0.52, 1.045),
      new THREE.Vector3(0, -0.515, 1.058),
      new THREE.Vector3(0.11, -0.52, 1.045),
      new THREE.Vector3(0.28, -0.47, 1.005),
    ]);
    const mouth = new THREE.Mesh(
      new THREE.TubeGeometry(mouthCurve, 24, 0.024, 8, false),
      new THREE.MeshStandardMaterial({ color: 0x633833, roughness: 0.84 })
    );
    avatar.add(mouth);

    const leftEye = makeEye();
    leftEye.position.set(-0.39, 0.23, 0.93);
    avatar.add(leftEye);

    const rightEye = makeEye();
    rightEye.position.set(0.39, 0.23, 0.93);
    avatar.add(rightEye);

    const leftEyebrow = makeEyebrow();
    leftEyebrow.position.set(-0.39, 0.54, 0.91);
    leftEyebrow.rotation.y = -0.08;
    avatar.add(leftEyebrow);

    const rightEyebrow = makeEyebrow();
    rightEyebrow.position.set(0.39, 0.54, 0.91);
    rightEyebrow.rotation.y = 0.08;
    avatar.add(rightEyebrow);

    const resize = () => {
      const width = Math.max(canvasHost.clientWidth, 1);
      const height = Math.max(canvasHost.clientHeight, 1);
      const aspect = width / height;
      const viewHeight = 4.35;
      camera.left = -(viewHeight * aspect) / 2;
      camera.right = (viewHeight * aspect) / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvasHost);
    resize();
    setWebglReady(true);

    const animate = () => {
      if (disposed) return;
      const target = reducedMotion ? RESTING_GAZE : gazeTarget.current;
      const headYaw = THREE.MathUtils.clamp(target.x * 0.46, -0.46, 0.46);
      const headPitch = THREE.MathUtils.clamp(target.y * -0.28, -0.28, 0.28);
      const eyeYaw = THREE.MathUtils.clamp(target.x * 0.31, -0.31, 0.31);
      const eyePitch = THREE.MathUtils.clamp(target.y * -0.2, -0.2, 0.2);

      avatar.rotation.y = THREE.MathUtils.damp(avatar.rotation.y, headYaw, 7, 1 / 60);
      avatar.rotation.x = THREE.MathUtils.damp(avatar.rotation.x, headPitch, 7, 1 / 60);
      leftEye.rotation.y = THREE.MathUtils.damp(leftEye.rotation.y, eyeYaw, 12, 1 / 60);
      leftEye.rotation.x = THREE.MathUtils.damp(leftEye.rotation.x, eyePitch, 12, 1 / 60);
      rightEye.rotation.y = THREE.MathUtils.damp(rightEye.rotation.y, eyeYaw, 12, 1 / 60);
      rightEye.rotation.x = THREE.MathUtils.damp(rightEye.rotation.x, eyePitch, 12, 1 / 60);

      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const material = object.material;
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

  const resetGaze = () => {
    gazeTarget.current = RESTING_GAZE;
  };

  return (
    <article
      ref={frameRef}
      onPointerMove={updateGaze}
      onPointerLeave={resetGaze}
      className="surface-dark relative min-h-[340px] overflow-hidden p-7 sm:min-h-[370px] sm:p-9 xl:min-h-[390px]"
    >
      <h1 className="sr-only">NISHETA eSPORTS HUB</h1>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_43%,rgba(229,180,109,0.18),transparent_25%),radial-gradient(circle_at_70%_60%,rgba(69,96,129,0.15),transparent_30%),linear-gradient(90deg,rgba(20,25,31,0.99)_0%,rgba(20,25,31,0.88)_44%,rgba(20,25,31,0.2)_73%,rgba(20,25,31,0.34)_100%)]" />
      <div ref={canvasRef} className="pointer-events-none absolute -right-[6%] -top-[4%] h-[110%] w-[72%] min-w-[340px] sm:-right-[2%] sm:w-[67%] xl:right-0 xl:w-[60%]" aria-hidden="true" />
      <img
        src="/hero-nisheta-portrait.png"
        alt=""
        className={`pointer-events-none absolute -right-[14%] -top-[10%] h-[122%] w-[75%] min-w-[330px] object-cover object-[58%_30%] transition-opacity duration-500 sm:-right-[5%] sm:w-[66%] xl:right-0 xl:w-[59%] ${webglReady ? "opacity-0" : "opacity-85"}`}
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
