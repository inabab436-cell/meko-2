/**
 * Zone map for the MEKO character canvas.
 * Coordinates are normalized (0..1) over the character stage.
 */
export type ZoneId =
  | "hair"
  | "forehead"
  | "leftEye"
  | "rightEye"
  | "nose"
  | "leftCheek"
  | "rightCheek"
  | "mouth"
  | "chin"
  | "neck"
  | "shirt"
  | "background";

export type Zone = {
  id: ZoneId;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** How ticklish / sensitive the zone is: drives reaction intensity 0..1 */
  sensitivity: number;
};

export const ZONES: Zone[] = [
  { id: "hair", label: "hair", x: 0.24, y: 0.05, w: 0.52, h: 0.16, sensitivity: 0.35 },
  { id: "forehead", label: "forehead", x: 0.32, y: 0.2, w: 0.36, h: 0.09, sensitivity: 0.4 },
  { id: "leftEye", label: "left eye", x: 0.32, y: 0.29, w: 0.15, h: 0.08, sensitivity: 1 },
  { id: "rightEye", label: "right eye", x: 0.53, y: 0.29, w: 0.15, h: 0.08, sensitivity: 1 },
  { id: "nose", label: "nose", x: 0.45, y: 0.37, w: 0.1, h: 0.09, sensitivity: 0.8 },
  { id: "leftCheek", label: "left cheek", x: 0.28, y: 0.38, w: 0.16, h: 0.12, sensitivity: 0.6 },
  { id: "rightCheek", label: "right cheek", x: 0.56, y: 0.38, w: 0.16, h: 0.12, sensitivity: 0.6 },
  { id: "mouth", label: "mouth", x: 0.42, y: 0.48, w: 0.16, h: 0.07, sensitivity: 0.9 },
  { id: "chin", label: "chin", x: 0.4, y: 0.55, w: 0.2, h: 0.08, sensitivity: 0.5 },
  { id: "neck", label: "neck", x: 0.4, y: 0.63, w: 0.2, h: 0.09, sensitivity: 0.95 },
  { id: "shirt", label: "shirt", x: 0.16, y: 0.72, w: 0.68, h: 0.28, sensitivity: 0.2 },
];

export function zoneAt(nx: number, ny: number): Zone | null {
  for (const z of ZONES) {
    if (nx >= z.x && nx <= z.x + z.w && ny >= z.y && ny <= z.y + z.h) return z;
  }
  return null;
}

export function zoneCenter(z: Zone): { x: number; y: number } {
  return { x: z.x + z.w / 2, y: z.y + z.h / 2 };
}
