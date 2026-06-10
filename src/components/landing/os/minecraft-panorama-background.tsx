"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  PANORAMA_CUBE,
  PANORAMA_FACE_COUNT,
  PANORAMA_FAR,
  PANORAMA_FOV_DEG,
  PANORAMA_NEAR,
  panoramaAnimAngles,
  panoramaFaceUrl,
} from "@/lib/landing/panorama-renderer";
import { cn } from "@/lib/utils";

interface MinecraftPanoramaBackgroundProps {
  className?: string;
}

function loadTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.colorSpace = THREE.SRGBColorSpace;
        resolve(tex);
      },
      undefined,
      () => reject(new Error(`panorama load: ${url}`)),
    );
  });
}

/** Vanilla MC title panorama — Three.js BoxGeometry + BackSide (wcze/minecraft-panorama). */
export function MinecraftPanoramaBackground({ className }: MinecraftPanoramaBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;

    let raf = 0;
    let running = true;
    let resizeObserver: ResizeObserver | null = null;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      premultipliedAlpha: false,
    });
    renderer.setClearColor(0x02060f, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      PANORAMA_FOV_DEG,
      1,
      PANORAMA_NEAR,
      PANORAMA_FAR,
    );
    camera.position.set(0, 0, 0);

    // pitch before yaw — horizon stays level (Ry(yaw)*Rx(pitch) tilts the view)
    const pitchPivot = new THREE.Group();
    const yawPivot = new THREE.Group();
    pitchPivot.add(yawPivot);
    scene.add(pitchPivot);

    let cube: THREE.Mesh | null = null;
    const textures: THREE.Texture[] = [];

    const resize = () => {
      const w = root.clientWidth || window.innerWidth;
      const h = root.clientHeight || window.innerHeight;
      if (w < 1 || h < 1) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const draw = (t: number) => {
      if (!running || !cube) return;
      resize();

      const timer = motion.matches ? 220 : (t / 1000) * 20;
      const { pitchDeg, yawDeg } = motion.matches
        ? { pitchDeg: 0, yawDeg: -12 }
        : panoramaAnimAngles(timer);

      pitchPivot.rotation.x = (pitchDeg * Math.PI) / 180;
      yawPivot.rotation.y = (yawDeg * Math.PI) / 180;

      renderer.render(scene, camera);

      if (!readyRef.current) {
        readyRef.current = true;
        canvas.classList.add("mc-panorama-canvas--ready");
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    window.addEventListener("resize", resize);

    void (async () => {
      try {
        const maps = await Promise.all(
          Array.from({ length: PANORAMA_FACE_COUNT }, (_, i) => loadTexture(panoramaFaceUrl(i))),
        );
        if (!running) return;
        textures.push(...maps);

        // Three.js BoxGeometry material order: +X,-X,+Y,-Y,+Z,-Z
        const materials = [
          new THREE.MeshBasicMaterial({ map: maps[1], side: THREE.BackSide }),
          new THREE.MeshBasicMaterial({ map: maps[3], side: THREE.BackSide }),
          new THREE.MeshBasicMaterial({ map: maps[4], side: THREE.BackSide }),
          new THREE.MeshBasicMaterial({ map: maps[5], side: THREE.BackSide }),
          new THREE.MeshBasicMaterial({ map: maps[0], side: THREE.BackSide }),
          new THREE.MeshBasicMaterial({ map: maps[2], side: THREE.BackSide }),
        ];

        const geometry = new THREE.BoxGeometry(PANORAMA_CUBE, PANORAMA_CUBE, PANORAMA_CUBE);
        cube = new THREE.Mesh(geometry, materials);
        yawPivot.add(cube);
        raf = requestAnimationFrame(draw);
      } catch {
        canvas.classList.add("mc-panorama-canvas--failed");
      }
    })();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      cube?.geometry.dispose();
      if (cube) {
        const mats = Array.isArray(cube.material) ? cube.material : [cube.material];
        for (const m of mats) m.dispose();
      }
      for (const tex of textures) tex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={rootRef} className={cn("mc-panorama-bg", className)} aria-hidden>
      <div className="mc-panorama-fallback" />
      <canvas ref={canvasRef} className="mc-panorama-canvas" />
      <div className="mc-panorama-vignette" />
    </div>
  );
}
