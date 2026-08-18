import { createFileRoute } from "@tanstack/react-router";

import { MekoStage } from "@/components/meko/MekoStage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MEKO — The Cartoon Character You Draw On, Live" },
      {
        name: "description",
        content:
          "Draw on a living cartoon character. She feels every stroke the instant it happens, talks back, gets ticklish, flustered and annoyed — and sometimes ruins your drawing on purpose.",
      },
      { property: "og:title", content: "MEKO — The Cartoon Character You Draw On, Live" },
      {
        property: "og:description",
        content:
          "A living 2D character that reacts to your pen in real time: ticklish, romantic, dramatic — and mischievous enough to smudge your art.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <header className="mx-auto mb-6 max-w-md text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">MEKO</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stage 1 — live rig, blink &amp; idle life, zone-aware canvas, instant reactions,
          and her own mischief.
        </p>
      </header>
      <MekoStage />
    </main>
  );
}
