import { Cpu, Gamepad2, Radio, Megaphone } from 'lucide-react';

/**
 * HomeHero — top banner for the SAS Cybernetics workstation. Sets the tone:
 * an AI studio you command — Controller, Receiver, Communicator — with Jackie
 * at the center. Pure presentation.
 */
export default function HomeHero() {
  return (
    <section
      aria-label="Welcome"
      className="eru-neon-foundation eru-neon-scanlines eru-theme-card relative overflow-hidden rounded-2xl border border-fuchsia-400/30 p-5 sm:p-7 eru-enter"
    >
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-70">
        <div className="eru-neon-grid-bg" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-fuchsia-500/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="relative max-w-2xl">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-fuchsia-300">
          <Cpu className="h-3 w-3" /> SAS Cybernetics · AI Studio Workstation
        </div>

        <h1 className="eru-neon-glow-text mt-3 text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
          Command your machine.
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          One workstation to forge AI agents, ingest the signals that matter, and
          speak to the world — with Jackie orchestrating it all. Three pillars,
          one command surface.
        </p>

        {/* The three pillars — the spine of the whole studio */}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs text-foreground">
            <Radio className="h-4 w-4 text-cyan-300" /> Controller
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-foreground">
            <Gamepad2 className="h-4 w-4 text-emerald-300" /> Receiver
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-2 text-xs text-foreground">
            <Megaphone className="h-4 w-4 text-fuchsia-300" /> Communicator
          </div>
        </div>
      </div>
    </section>
  );
}