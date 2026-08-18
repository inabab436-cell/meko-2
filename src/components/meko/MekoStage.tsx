import { useCallback, useEffect, useRef, useState } from "react";

import { MekoCharacter } from "./MekoCharacter";
import { SpeechBubble } from "./SpeechBubble";
import {
  NEUTRAL_POSE,
  pickIdle,
  pickLive,
  pickMischief,
  poseFor,
  type Mood,
  type Pose,
} from "@/lib/meko/reactions";
import { zoneAt, type ZoneId } from "@/lib/meko/zones";
import { cn } from "@/lib/utils";

type Point = { x: number; y: number };
type Stroke = { points: Point[]; color: string; size: number; zone: ZoneId | null };

const COLORS = ["#2b2233", "#ff2e63", "#ffd166", "#3ddc97", "#4cc9f0", "#ffffff"];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return {
    tilt: lerp(a.tilt, b.tilt, t),
    eyelid: lerp(a.eyelid, b.eyelid, t),
    mouth: lerp(a.mouth, b.mouth, t),
    brow: lerp(a.brow, b.brow, t),
    flinchX: lerp(a.flinchX, b.flinchX, t),
    flinchY: lerp(a.flinchY, b.flinchY, t),
    blush: lerp(a.blush, b.blush, t),
  };
}

export function MekoStage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const drawing = useRef(false);
  const lastPoint = useRef<Point | null>(null);
  const lastTime = useRef(0);
  const lastZone = useRef<ZoneId | null>(null);
  const lastSpeak = useRef(0);
  const lastActivity = useRef(performance.now());
  const targetPose = useRef<Pose>(NEUTRAL_POSE);

  const [pose, setPose] = useState<Pose>(NEUTRAL_POSE);
  const [look, setLook] = useState({ x: 0.5, y: 0.42 });
  const [contact, setContact] = useState(false);
  const [line, setLine] = useState<{ text: string; quiet: boolean; id: number }>({
    text: "Okay. Draw on me. Gently.",
    quiet: true,
    id: 0,
  });
  const [color, setColor] = useState(COLORS[0]!);
  const [size, setSize] = useState(8);
  const [mood, setMood] = useState<Mood>("calm");

  const say = useCallback((text: string, quiet: boolean, m: Mood, intensity: number) => {
    const now = performance.now();
    if (now - lastSpeak.current < 900) return;
    lastSpeak.current = now;
    setLine({ text, quiet, id: now });
    setMood(m);
    // Quiet lines barely move the face — a human holding still to be drawn on.
    const p = poseFor(m, quiet ? intensity * 0.28 : intensity);
    targetPose.current = p;
    setTimeout(() => {
      targetPose.current = quiet ? { ...NEUTRAL_POSE, eyelid: 0.25 } : NEUTRAL_POSE;
    }, quiet ? 1500 : 900);
  }, []);

  // pose easing loop
  useEffect(() => {
    let id = 0;
    const loop = () => {
      setPose((p) => lerpPose(p, targetPose.current, 0.22));
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const s of strokes.current) {
      if (s.points.length === 0) continue;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.beginPath();
      ctx.moveTo(s.points[0]!.x * c.width, s.points[0]!.y * c.height);
      for (const p of s.points.slice(1)) ctx.lineTo(p.x * c.width, p.y * c.height);
      if (s.points.length === 1) ctx.lineTo(s.points[0]!.x * c.width + 0.1, s.points[0]!.y * c.height);
      ctx.stroke();
    }
  }, []);

  // keep the canvas backing store in sync with layout
  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current;
      const w = wrapRef.current;
      if (!c || !w) return;
      const r = w.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = r.width * dpr;
      c.height = r.height * dpr;
      redraw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [redraw]);

  const norm = (e: React.PointerEvent) => {
    const r = wrapRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    const p = norm(e);
    drawing.current = true;
    lastPoint.current = p;
    lastTime.current = performance.now();
    lastActivity.current = performance.now();
    setContact(true);
    setLook(p);
    const z = zoneAt(p.x, p.y);
    lastZone.current = z?.id ?? null;
    strokes.current.push({ points: [p], color, size, zone: z?.id ?? null });
    redraw();
    // same-frame reaction to first contact
    if (z) {
      const l = pickLive(z.id, 0);
      if (l) say(l.text, !!l.quiet, l.mood, z.sensitivity);
    }
  };

  const onMove = (e: React.PointerEvent) => {
    const p = norm(e);
    setLook(p);
    if (!drawing.current) return;
    lastActivity.current = performance.now();
    const now = performance.now();
    const prev = lastPoint.current ?? p;
    const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
    const speed = dist / Math.max(1, now - lastTime.current) * 1000;
    lastPoint.current = p;
    lastTime.current = now;

    strokes.current[strokes.current.length - 1]?.points.push(p);
    redraw();

    const z = zoneAt(p.x, p.y);
    const zid = z?.id ?? null;
    if (z && zid !== lastZone.current) {
      lastZone.current = zid;
      const l = pickLive(z.id, speed);
      if (l) say(l.text, !!l.quiet, l.mood, z.sensitivity);
    } else if (z && speed > 2.2) {
      // sudden scribble -> flinch immediately, no waiting for the stroke to end
      targetPose.current = poseFor("annoyed", z.sensitivity);
      say("Hey! Slow down!", false, "annoyed", 1);
    }
  };

  const onUp = () => {
    drawing.current = false;
    setContact(false);
    lastPoint.current = null;
    lastActivity.current = performance.now();
  };

  // idle awareness — she keeps living after the pen leaves
  useEffect(() => {
    const t = setInterval(() => {
      if (drawing.current) return;
      if (performance.now() - lastActivity.current < 4500) return;
      lastActivity.current = performance.now();
      const l = pickIdle();
      say(l.text, !!l.quiet, l.mood, 0.7);
    }, 1500);
    return () => clearInterval(t);
  }, [say]);

  // mischief: she ruins a piece of the drawing on her own
  useEffect(() => {
    const schedule = () =>
      setTimeout(
        () => {
          if (strokes.current.length > 2 && !drawing.current) {
            const idx = Math.floor(Math.random() * strokes.current.length);
            const s = strokes.current[idx]!;
            const keep = Math.max(1, Math.floor(s.points.length * 0.45));
            const smeared = s.points.slice(0, keep).map((p, i) => ({
              x: p.x + (i / keep) * 0.03,
              y: p.y + (i / keep) * 0.02,
            }));
            s.points = smeared;
            redraw();
            const l = pickMischief();
            lastSpeak.current = 0;
            say(l.text, false, l.mood, 1);
          }
          timer = schedule();
        },
        18000 + Math.random() * 20000,
      );
    let timer = schedule();
    return () => clearTimeout(timer);
  }, [redraw, say]);

  const undo = () => {
    strokes.current.pop();
    redraw();
  };
  const clear = () => {
    strokes.current = [];
    redraw();
    lastSpeak.current = 0;
    say("Blank again. Rude, but okay.", false, "annoyed", 0.8);
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div
        ref={wrapRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        className="relative aspect-[10/14] w-full max-w-md touch-none overflow-hidden rounded-3xl border border-border bg-[#fef7f2] shadow-2xl"
      >
        <div className="absolute inset-0">
          <MekoCharacter pose={pose} look={look} contact={contact} speaking={0} />
        </div>
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        <SpeechBubble text={line.text} quiet={line.quiet} id={line.id} />
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          mood: {mood}
        </div>
      </div>

      <div className="flex w-full max-w-md flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label={`color ${c}`}
              className={cn(
                "h-7 w-7 rounded-full border-2 transition",
                color === c ? "scale-110 border-primary" : "border-border",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <input
          type="range"
          min={2}
          max={28}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-24 accent-primary"
          aria-label="brush size"
        />
        <div className="flex gap-2">
          <button
            onClick={undo}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent"
          >
            Undo
          </button>
          <button
            onClick={clear}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
