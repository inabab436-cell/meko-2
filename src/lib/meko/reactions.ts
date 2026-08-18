/**
 * Stage 1 local reaction engine.
 * Instant, frame-level responses to what the pen is doing right now.
 * (Stage 2 replaces the line picking with AI structured output; the
 * emotion/pose state machine below stays the same.)
 */
import type { ZoneId } from "./zones";

export type Mood = "calm" | "happy" | "ticklish" | "annoyed" | "flustered" | "mischief";

export type Pose = {
  /** -1..1 head tilt */
  tilt: number;
  /** eyes closed 0..1 */
  eyelid: number;
  /** mouth open 0..1 */
  mouth: number;
  /** brow raise -1..1 */
  brow: number;
  /** whole-body flinch offset px */
  flinchX: number;
  flinchY: number;
  blush: number;
};

export const NEUTRAL_POSE: Pose = {
  tilt: 0,
  eyelid: 0,
  mouth: 0,
  brow: 0,
  flinchX: 0,
  flinchY: 0,
  blush: 0,
};

type Line = { text: string; mood: Mood; quiet?: boolean };

const LIVE_LINES: Partial<Record<ZoneId, Line[]>> = {
  leftEye: [
    { text: "Whoa — eye. Okay. Holding still.", mood: "ticklish", quiet: true },
    { text: "Don't poke it, I'm begging you.", mood: "annoyed" },
    { text: "Eyeliner? Fine. But make it sharp.", mood: "happy" },
  ],
  rightEye: [
    { text: "Other side now… okay, closed.", mood: "ticklish", quiet: true },
    { text: "You'd better make them match.", mood: "annoyed" },
  ],
  nose: [
    { text: "That tickles so bad.", mood: "ticklish" },
    { text: "Careful, careful — nose is delicate.", mood: "ticklish", quiet: true },
  ],
  mouth: [
    { text: "Mmph — can't talk while you do that.", mood: "ticklish", quiet: true },
    { text: "Make my lips nice, please.", mood: "flustered" },
  ],
  leftCheek: [{ text: "Blush? Oh. You're making me blush for real.", mood: "flustered" }],
  rightCheek: [{ text: "Okay that one's warm.", mood: "flustered" }],
  hair: [
    { text: "Ooh, hair. Go wild.", mood: "happy" },
    { text: "Pink. Obviously pink.", mood: "happy" },
  ],
  neck: [
    { text: "NOT THE NECK.", mood: "ticklish" },
    { text: "I will move. I'm warning you.", mood: "annoyed" },
  ],
  forehead: [{ text: "Careful, that's prime real estate.", mood: "calm", quiet: true }],
  chin: [{ text: "Chin's fine. Keep going.", mood: "calm", quiet: true }],
  shirt: [{ text: "Yeah, the shirt needed help.", mood: "calm" }],
};

const IDLE_LINES: Line[] = [
  { text: "…you stopped. Is it bad?", mood: "annoyed" },
  { text: "Take your time. I'm not going anywhere.", mood: "calm", quiet: true },
  { text: "I can feel you looking at me.", mood: "flustered", quiet: true },
  { text: "Hey. Show me a mirror.", mood: "happy" },
  { text: "If you leave me half-drawn I riot.", mood: "annoyed" },
];

const MISCHIEF_LINES: Line[] = [
  { text: "Oops. My hand slipped.", mood: "mischief" },
  { text: "I smudged it. It was ugly anyway.", mood: "mischief" },
  { text: "Redo that part. I didn't like it.", mood: "mischief" },
];

export function pickLive(zone: ZoneId, speed: number): Line | null {
  const pool = LIVE_LINES[zone];
  if (!pool) return null;
  const line = pool[Math.floor(Math.random() * pool.length)]!;
  // Fast, scratchy strokes read as aggressive -> louder reaction.
  if (speed > 1.4 && line.quiet) return { ...line, quiet: false, mood: "annoyed" };
  return line;
}

export function pickIdle(): Line {
  return IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)]!;
}

export function pickMischief(): Line {
  return MISCHIEF_LINES[Math.floor(Math.random() * MISCHIEF_LINES.length)]!;
}

export function poseFor(mood: Mood, intensity: number): Pose {
  const i = Math.max(0, Math.min(1, intensity));
  switch (mood) {
    case "ticklish":
      return { tilt: -0.5 * i, eyelid: 0.9, mouth: 0.5 * i, brow: 0.6, flinchX: -6 * i, flinchY: 3 * i, blush: 0.3 * i };
    case "annoyed":
      return { tilt: 0.3 * i, eyelid: 0.55, mouth: 0.25, brow: -0.8, flinchX: 4 * i, flinchY: 0, blush: 0.1 };
    case "flustered":
      return { tilt: 0.15, eyelid: 0.35, mouth: 0.3, brow: 0.4, flinchX: 0, flinchY: 2, blush: 0.9 * i };
    case "happy":
      return { tilt: -0.15, eyelid: 0.2, mouth: 0.6, brow: 0.3, flinchX: 0, flinchY: -2, blush: 0.25 };
    case "mischief":
      return { tilt: 0.35, eyelid: 0.5, mouth: 0.45, brow: -0.3, flinchX: 3, flinchY: 0, blush: 0.15 };
    default:
      return NEUTRAL_POSE;
  }
}
