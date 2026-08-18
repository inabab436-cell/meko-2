import { useEffect, useRef, useState } from "react";

import type { Pose } from "@/lib/meko/reactions";

type Props = {
  pose: Pose;
  /** where the pen / cursor is, normalized 0..1 — the eyes follow it live */
  look: { x: number; y: number };
  /** true while the pen is on the character */
  contact: boolean;
  /** 0..1 speaking amplitude, drives the mouth */
  speaking: number;
};

/**
 * 2D character rig. Every visual feature is driven by numbers, never by
 * pre-baked animation clips, so it can react on the same frame as the pen.
 */
export function MekoCharacter({ pose, look, contact, speaking }: Props) {
  const [blink, setBlink] = useState(0);
  const [breath, setBreath] = useState(0);
  const raf = useRef(0);

  // autonomous blinking
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          setBlink(1);
          setTimeout(() => setBlink(0), 110);
          schedule();
        },
        1800 + Math.random() * 3200,
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  // idle breathing
  useEffect(() => {
    const start = performance.now();
    const loop = (t: number) => {
      setBreath(Math.sin((t - start) / 900));
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const lid = Math.min(1, Math.max(pose.eyelid, blink));
  const mouthOpen = Math.max(pose.mouth, speaking);
  const pupilX = (look.x - 0.5) * 26;
  const pupilY = (look.y - 0.42) * 18;
  const headTilt = pose.tilt * 7;
  const bx = pose.flinchX + (contact ? Math.sin(breath * 3) * 0.6 : 0);
  const by = pose.flinchY + breath * 3;

  const skin = "#f7d9c4";
  const skinShade = "#e8bfa6";
  const hair = "#ff77a9";
  const hairDark = "#e0538b";
  const ink = "#2b2233";

  return (
    <svg viewBox="0 0 1000 1400" className="h-full w-full select-none" aria-hidden>
      <defs>
        <radialGradient id="blushGrad">
          <stop offset="0%" stopColor="#ff6f91" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ff6f91" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g transform={`translate(${bx} ${by})`}>
        {/* torso */}
        <path
          d="M160 1400 C170 1120 300 1010 500 1010 C700 1010 830 1120 840 1400 Z"
          fill="#4b3f6b"
        />
        <path d="M430 1010 h140 v70 a70 70 0 0 1 -140 0 Z" fill={skinShade} />

        <g transform={`rotate(${headTilt} 500 620)`}>
          {/* neck */}
          <rect x="440" y="860" width="120" height="130" rx="46" fill={skinShade} />

          {/* back hair */}
          <path d="M245 470 C245 235 350 110 500 110 C650 110 755 235 755 470 L755 780 L245 780 Z" fill={hairDark} />

          {/* head */}
          <path
            d="M262 520 C262 315 368 190 500 190 C632 190 738 315 738 520 L738 640 C738 830 640 930 500 930 C360 930 262 830 262 640 Z"
            fill={skin}
          />

          {/* ears */}
          <ellipse cx="262" cy="620" rx="30" ry="46" fill={skin} />
          <ellipse cx="738" cy="620" rx="30" ry="46" fill={skin} />

          {/* front hair */}
          <path
            d="M250 500 C250 290 360 165 500 165 C640 165 750 290 750 500 C700 400 640 350 560 340 C540 400 470 430 400 415 C350 450 300 460 250 500 Z"
            fill={hair}
          />
          <path d="M690 210 C780 300 790 430 762 520 L735 470 C745 380 725 290 690 210 Z" fill={hairDark} />

          {/* brows */}
          <g stroke={ink} strokeWidth="16" strokeLinecap="round" fill="none">
            <path d={`M355 ${455 - pose.brow * 22} q55 ${-18 - pose.brow * 14} 118 ${2 - pose.brow * 6}`} />
            <path d={`M527 ${457 - pose.brow * 22} q63 ${-20 - pose.brow * 14} 118 ${-2 + pose.brow * 6}`} />
          </g>

          {/* eyes */}
          {[390, 610].map((cx) => (
            <g key={cx}>
              <ellipse cx={cx} cy="545" rx="62" ry={62 * (1 - lid * 0.94) + 2} fill="#ffffff" />
              <g clipPath="none" opacity={1 - lid}>
                <circle cx={cx + pupilX} cy={545 + pupilY} r="30" fill="#3b2f66" />
                <circle cx={cx + pupilX} cy={545 + pupilY} r="13" fill="#120e22" />
                <circle cx={cx + pupilX - 10} cy={535 + pupilY} r="8" fill="#ffffff" opacity="0.9" />
              </g>
              <path
                d={`M${cx - 66} 545 q66 ${-64 * (1 - lid) - 4} 132 0`}
                fill="none"
                stroke={ink}
                strokeWidth="14"
                strokeLinecap="round"
              />
            </g>
          ))}

          {/* blush */}
          <g opacity={pose.blush}>
            <ellipse cx="345" cy="670" rx="72" ry="46" fill="url(#blushGrad)" />
            <ellipse cx="655" cy="670" rx="72" ry="46" fill="url(#blushGrad)" />
          </g>

          {/* nose */}
          <path d="M500 610 q18 42 -6 56" stroke={skinShade} strokeWidth="12" fill="none" strokeLinecap="round" />

          {/* mouth */}
          <path
            d={`M432 ${728} q68 ${34 + mouthOpen * 26} 136 0 q-68 ${mouthOpen * 96 - 6} -136 0 Z`}
            fill={mouthOpen > 0.12 ? "#8e2f4a" : "none"}
            stroke={ink}
            strokeWidth="12"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
}
