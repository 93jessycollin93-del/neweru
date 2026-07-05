import { useFeatureTracking } from '../hooks/useFeatureTracking';
import {
  Radio, Gamepad2, Megaphone, MessagesSquare,
  Bot, Workflow, Cpu, GitBranch,
  Plug, Send, Database, BarChart2,
  Bell, Store,
  Scale, TrendingUp, Repeat,
} from 'lucide-react';
import HomeHero from '../components/home/HomeHero';
import HomeSection from '../components/home/HomeSection';
import AdvertisingTeaser from '../components/home/AdvertisingTeaser';
import HomeAuthButton from '../components/home/HomeAuthButton';

/**
 * Home — the SAS Cybernetics workstation landing. A guided tour of the studio,
 * organized around its three pillars — Controller, Receiver, Communicator —
 * with Jackie orchestrating between them. Pure presentation; each pathway links
 * to a real page.
 */
export default function Home() {
  useFeatureTracking('Home');

  return (
    <div
      className="flex flex-col min-h-screen bg-background pb-28 md:pb-12"
      style={{
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <div className="mx-auto w-full max-w-3xl px-4 pt-4 space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-end gap-2">
          <HomeAuthButton />
        </div>

        <HomeHero />

        {/* PILLAR 1 — CONTROLLER: command AI agents */}
        <HomeSection
          eyebrow="Pillar 1 · Controller"
          title="Forge & command your agents"
          subtitle="Design, train, and deploy AI bots — then orchestrate them from one command surface."
          Icon={Radio}
          accent="cyan"
          steps={[
            { icon: Cpu, title: 'BotForge', desc: 'Design, train, and deploy AI bots in the AI Lab.' },
            { icon: Bot, title: 'Bot Farm', desc: 'Run squads with leaders, commanders, and security bots.' },
            { icon: GitBranch, title: 'Build', desc: 'Compose systems and pipelines in the System Builder.' },
            { icon: Workflow, title: 'Automate', desc: 'Schedule tasks and let agents run your routines.' },
          ]}
          cta={{ label: 'Open BotForge', to: '/bot-forge' }}
        />

        {/* PILLAR 2 — RECEIVER: ingest signals & data */}
        <HomeSection
          eyebrow="Pillar 2 · Receiver"
          title="Ingest the signals that matter"
          subtitle="Pull in data, feeds, and knowledge from everywhere your agents need to see."
          Icon={Gamepad2}
          accent="emerald"
          steps={[
            { icon: Plug, title: 'Integrate', desc: 'Connect Sheets, Telegram, and many more services.' },
            { icon: Database, title: 'Knowledge', desc: 'Feed datasets and documents into the knowledge base.' },
            { icon: BarChart2, title: 'Markets', desc: 'Stream live market data and price signals.' },
          ]}
          cta={{ label: 'Open Integrations', to: '/integrations' }}
        />

        {/* PILLAR 3 — COMMUNICATOR: speak & act outward */}
        <HomeSection
          eyebrow="Pillar 3 · Communicator"
          title="Speak to the world"
          subtitle="Push messages, alerts, and actions outward — on Telegram and beyond."
          Icon={Megaphone}
          accent="fuchsia"
          steps={[
            { icon: Send, title: 'Telegram Bots', desc: 'Broadcast and converse through your Telegram bots.' },
            { icon: Bell, title: 'Alerts', desc: 'Get notified the moment something needs you.' },
            { icon: MessagesSquare, title: 'Community', desc: 'Post, chat, and share strategies with others.' },
            { icon: Store, title: 'Storefront', desc: 'Sell and syndicate to your storefront and markets.' },
          ]}
          cta={{ label: 'Open Telegram Bots', to: '/telegram-bots' }}
        />

        {/* HALF SECTION — Balance / Scaling / Adapting */}
        <HomeSection
          eyebrow="Refine"
          title="Balance, Scaling & Adapting"
          subtitle="Keep everything healthy as you grow — tune performance and adapt over time."
          Icon={Scale}
          accent="cyan"
          half
          steps={[
            { icon: Scale, title: 'Balance', desc: 'Keep risk and resources in check.' },
            { icon: TrendingUp, title: 'Scale', desc: 'Grow bots and activity smoothly.' },
            { icon: Repeat, title: 'Adapt', desc: 'Adjust strategies as conditions change.' },
          ]}
          cta={{ label: 'Open Performance', to: '/performance' }}
        />

        {/* ADVERTISING TEASER — small "coming soon" slogan strip at the bottom */}
        <AdvertisingTeaser />
      </div>
    </div>
  );
}