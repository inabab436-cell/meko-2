# MEKO — Project Handoff Notes

> Handoff file for other tools/agents. Updated at the end of each stage.

## Concept
A living 2D cartoon character on a drawing canvas. The user draws on her with a pen/finger.
She feels **every stroke at the instant it happens** (not after the stroke ends), talks in
English only, has a human personality (funny, nervous, romantic, dramatic), reacts to how
she is treated, has full memory, thinks on her own, surprises the user, and can
**deliberately ruin part of the drawing**.

## Stack
- TanStack Start v1 (React 19, Vite) — SSR + `createServerFn` for server logic.
- Tailwind v4 (`src/styles.css`), shadcn components in `src/components/ui`.
- Supabase via `@supabase/supabase-js`, **server-side only**.

## Stage 1 — DONE (this commit)
Files:
- `src/lib/meko/zones.ts` — normalized zone map of the character (hair, eyes, nose, mouth,
  cheeks, chin, neck, shirt) with a `sensitivity` value per zone driving reaction intensity.
- `src/lib/meko/reactions.ts` — local reaction engine: mood types (`calm | happy | ticklish |
  annoyed | flustered | mischief`), numeric `Pose` (tilt, eyelid, mouth, brow, flinchX/Y, blush),
  line pools for live / idle / mischief, `poseFor(mood, intensity)`.
  **Stage 2 will replace only the line picking with AI structured output; the pose state machine stays.**
- `src/components/meko/MekoCharacter.tsx` — SVG rig fully driven by numbers (no baked clips):
  autonomous blinking, idle breathing, live pupil tracking of the pen, brows, mouth opening,
  blush, head tilt, body flinch.
- `src/components/meko/SpeechBubble.tsx` — typed-out bubble; `quiet` lines render small/italic.
- `src/components/meko/MekoStage.tsx` — drawing canvas + reaction loop:
  - strokes kept in a ref (`{points, color, size, zone}`) and fully re-rendered, which is what
    makes **removing/smudging** possible.
  - reaction fires on `pointerdown` and on every zone change **during** the stroke; stroke speed
    is measured per move event (fast scribble => annoyed flinch).
  - eyes keep following the cursor after the pen is lifted; idle lines after ~4.5s of stillness.
  - **quiet mode**: quiet lines apply only ~28% pose intensity, so she talks calmly without
    ruining the drawing — like a real person being drawn on.
  - **mischief timer** (18–38s): picks a random stroke, truncates and smears it, then comments.
- `src/routes/index.tsx` — page + SEO head.

## Supabase wiring — DONE
`src/lib/supabase.server.ts` (server-only, blocked from client bundles by the `.server.ts` name):
- reads secrets `MEKO_SB_URL`, `MEKO_SB_ANON`, `MEKO_SB_SERVICE` via `process.env` **inside** the functions.
- `getPublicClient()` → anon key, RLS enforced. Use for normal public reads.
- `getServiceClient()` → service role key, RLS bypassed. Server-sensitive operations only.
- Never imported from a component; import it inside a `createServerFn` handler.
- **RLS must be enabled on every table** created later (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
  plus explicit `GRANT`s) — no table ships without it.
- **Secrets status:** all three keys (`MEKO_SB_URL`, `MEKO_SB_ANON`, `MEKO_SB_SERVICE`) are now
  configured in the project Secrets section and available to server functions.

## Next stages
2. AI-driven dialogue: structured output (mood + line + pose + optional action) aware of the zone,
   stroke speed, colors used and drawing history.
3. Voice: TTS with a warm young female English voice + lip sync from audio amplitude
   (`MekoCharacter` already takes a `speaking` prop, currently 0), and STT for talking back.
4. Supabase persistence: sessions, strokes, memory of the user (RLS per user).
5. Vision: actually looking at the produced drawing and commenting on it; refusal / mood carry-over.
6. Reel export + shareable drawable link (the trend mechanic).
