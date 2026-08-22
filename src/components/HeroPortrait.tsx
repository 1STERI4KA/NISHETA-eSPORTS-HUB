"use client";

import Link from "next/link";
import { ArrowUpRight, Gamepad2 } from "lucide-react";
import { PointerEvent, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const HEAD_MAX_YAW = THREE.MathUtils.degToRad(60);
const HEAD_MAX_PITCH = THREE.MathUtils.degToRad(45);
const EYE_MAX_YAW = THREE.MathUtils.degToRad(28);
const EYE_MAX_PITCH = THREE.MathUtils.degToRad(20);

type Bones = {
  head: THREE.Bone;
  leftEye: THREE.Bone;
  rightEye: THREE.Bone;
  headRest: THREE.Quaternion;
  leftEyeRest: THREE.Quaternion;
  rightEyeRest: THREE.Quaternion;
};

export default function HeroPortrait() {
  const frameRef = useRef<HTMLElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const mouseTarget = useRef(new THREE.Vector2(0, 0));
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
    camera.position.set(0, 0.02, 5.65);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    host.replaceChildren(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xfff5e8, 0x131c28, 2.5));
    const keyLight = new THREE.DirectionalLight(0xfff0db, 3.6);
    keyLight.position.set(-3.4, 3.5, 4.8);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xe9ac60, 4.2);
    rimLight.position.set(4.2, 1.5, 3.2);
    scene.add(rimLight);
    const coolFill = new THREE.PointLight(0x8bb5e1, 1.1, 6);
    coolFill.position.set(-2.4, -0.8, 2.8);
    scene.add(coolFill);

    const avatarGroup = new THREE.Group();
    avatarGroup.position.set(0.72, -0.04, 0);
    scene.add(avatarGroup);

    let bones: Bones | null = null;
    let animationFrame = 0;
    let disposed = false;
    const clock = new THREE.Clock();
    const loader = new GLTFLoader();

    loader.load(
      "/models/friend-metaperson/model.gltf",
      (gltf) => {
        if (disposed) return;

        const avatar = gltf.scene;
        let head: THREE.Bone | null = null;
        let leftEye: THREE.Bone | null = null;
        let rightEye: THREE.Bone | null = null;

        avatar.traverse((node) => {
          node.frustumCulled = false;
          if (node instanceof THREE.Bone) {
            if (node.name === "Head") head = node;
            if (node.name === "LeftEye") leftEye = node;
            if (node.name === "RightEye") rightEye = node;
          }
        });

        const resolvedHead = avatar.getObjectByName("Head") as THREE.Bone | undefined;
        const resolvedLeftEye = avatar.getObjectByName("LeftEye") as THREE.Bone | undefined;
        const resolvedRightEye = avatar.getObjectByName("RightEye") as THREE.Bone | undefined;

        avatar.scale.setScalar(2.68);
        avatar.updateMatrixWorld(true);

        // Кадрирование: центрируем риг именно по кости головы, поэтому лицо не режется границей hero-блока.
        if (resolvedHead) {
          const headPosition = new THREE.Vector3();
          resolvedHead.getWorldPosition(headPosition);
          avatar.position.sub(headPosition);
          avatar.position.y -= 0.03;
        }

        if (resolvedHead && resolvedLeftEye && resolvedRightEye) {
          bones = {
            head: resolvedHead,
            leftEye: resolvedLeftEye,
            rightEye: resolvedRightEye,
            headRest: resolvedHead.quaternion.clone(),
            leftEyeRest: resolvedLeftEye.quaternion.clone(),
            rightEyeRest: resolvedRightEye.quaternion.clone(),
          };
        }

        avatarGroup.add(avatar);
        setModelReady(Boolean(bones));
      },
      undefined,
      () => {
        if (!disposed) setModelReady(false);
      }
    );

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const animate = () => {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      const targetX = reducedMotion ? 0 : mouseTarget.current.x;
      const targetY = reducedMotion ? 0 : mouseTarget.current.y;

      if (bones) {
        // 1–3. Курсор уже нормализован в диапазон −1…1; из него получаем target rotation головы и глаз.
        const headYaw = THREE.MathUtils.clamp(targetX * HEAD_MAX_YAW, -HEAD_MAX_YAW, HEAD_MAX_YAW);
        const headPitch = THREE.MathUtils.clamp(-targetY * HEAD_MAX_PITCH, -HEAD_MAX_PITCH, HEAD_MAX_PITCH);
        const eyeYaw = THREE.MathUtils.clamp(targetX * EYE_MAX_YAW, -EYE_MAX_YAW, EYE_MAX_YAW);
        const eyePitch = THREE.MathUtils.clamp(-targetY * EYE_MAX_PITCH, -EYE_MAX_PITCH, EYE_MAX_PITCH);

        // 4. Голова ограничена ±60° по yaw и ±45° по pitch; глаза имеют собственные, безопасные пределы.
        const headOffset = new THREE.Quaternion().setFromEuler(new THREE.Euler(headPitch, headYaw, 0, "YXZ"));
        const eyeOffset = new THREE.Quaternion().setFromEuler(new THREE.Euler(eyePitch, eyeYaw, 0, "YXZ"));
        const targetHead = bones.headRest.clone().multiply(headOffset);
        const targetLeftEye = bones.leftEyeRest.clone().multiply(eyeOffset);
        const targetRightEye = bones.rightEyeRest.clone().multiply(eyeOffset);

        // 5. Голова догоняет target медленнее: движение выглядит естественно, без рывков.
        const headSmoothing = 1 - Math.exp(-4.1 * delta);
        bones.head.quaternion.slerp(targetHead, headSmoothing);

        // 6. Глаза получают отдельный target и двигаются быстрее головы, направляя взгляд прямо на курсор.
        const eyeSmoothing = 1 - Math.exp(-12 * delta);
        bones.leftEye.quaternion.slerp(targetLeftEye, eyeSmoothing);
        bones.rightEye.quaternion.slerp(targetRightEye, eyeSmoothing);
      }

      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      scene.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        node.geometry.dispose();
        if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose());
        else node.material.dispose();
      });
      renderer.dispose();
      host.replaceChildren();
    };
  }, []);

  const trackPointer = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    const frame = frameRef.current;
    if (!frame) return;

    // 1–2. Позиция мыши переводится в нормализованные координаты −1…1 относительно центра hero-блока.
    const bounds = frame.getBoundingClientRect();
    mouseTarget.current.set(
      THREE.MathUtils.clamp(((event.clientX - bounds.left) / bounds.width - 0.5) * 2, -1, 1),
      THREE.MathUtils.clamp(((event.clientY - bounds.top) / bounds.height - 0.5) * 2, -1, 1)
    );
  };

  return (
    <article
      ref={frameRef}
      onPointerMove={trackPointer}
      onPointerLeave={() => mouseTarget.current.set(0, 0)}
      className="surface-dark relative min-h-[340px] overflow-hidden p-7 sm:min-h-[370px] sm:p-9 xl:min-h-[390px]"
    >
      <h1 className="sr-only">NISHETA eSPORTS HUB</h1>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_79%_44%,rgba(229,180,109,0.19),transparent_29%),radial-gradient(circle_at_77%_69%,rgba(95,130,169,0.13),transparent_34%),linear-gradient(90deg,rgba(20,25,31,0.99)_0%,rgba(20,25,31,0.89)_46%,rgba(20,25,31,0.18)_75%,rgba(20,25,31,0.32)_100%)]" />
      <div ref={canvasHostRef} className="pointer-events-none absolute right-0 top-0 h-full w-[61%] sm:w-[57%] xl:w-[54%]" aria-hidden="true" />
      <img
        src="/hero-friend-source.jpg"
        alt=""
        className={`pointer-events-none absolute right-0 top-0 h-full w-[56%] select-none object-cover object-[50%_34%] transition-opacity duration-500 sm:w-[51%] xl:w-[49%] ${modelReady ? "opacity-0" : "opacity-90"}`}
        draggable={false}
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
            Глаза следят. Голова догоняет.
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
