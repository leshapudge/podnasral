/**
 * Minecraft TitleScreen panorama — constants + animation (rendering via Three.js).
 */

export const PANORAMA_CROSS = "/assets/mc/panorama/cross.png";
export const panoramaFaceUrl = (index: number) => `/assets/mc/panorama/${index}.png`;
export const PANORAMA_FACE_SRC = 256;
export const PANORAMA_FACE_COUNT = 6;
export const PANORAMA_CUBE = 10;
export const PANORAMA_FOV_DEG = 90;
export const PANORAMA_NEAR = 0.1;
export const PANORAMA_FAR = 1000;

/** pitch/yaw in degrees — gentle bob around level horizon, slow spin. */
export function panoramaAnimAngles(timer: number) {
  return {
    pitchDeg: Math.sin(timer / 500) * 6,
    yawDeg: -timer * 0.045,
  };
}
