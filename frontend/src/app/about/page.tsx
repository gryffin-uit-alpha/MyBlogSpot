'use client';

import { motion } from 'framer-motion';

const techStack = [
  { category: 'Infrastructure', items: ['Kubernetes', 'Docker', 'Terraform', 'AWS'] },
  { category: 'CI/CD', items: ['GitHub Actions', 'ArgoCD', 'Jenkins', 'GitLab CI'] },
  { category: 'Monitoring', items: ['Prometheus', 'Grafana', 'ELK Stack', 'Datadog'] },
  { category: 'Languages', items: ['Go', 'Python', 'Bash'] },
];

const musicGear = [
  { name: 'Piano', desc: 'Roland Digital Piano' },
  { name: 'Guitar', desc: 'Fender Stratocaster + BlackStar Amp' },
  { name: 'DAW', desc: 'FL Studio + Ableton Live' },
  { name: 'Vibes', desc: 'Lofi Hip Hop, Jazz, Ambient' },
];

const gamingSetup = [
  { name: 'Main', desc: 'League of Legends (Jungler Main)' },
  { name: 'Rank', desc: 'Fluctuating between Plat/Diamond' },
  { name: 'Playstyle', desc: 'Aggressive laning, macro-focused' },
  { name: 'Status', desc: 'Permanently tilted but never gives up' },
];

export default function AboutPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100">
      <div className="container-wide mx-auto px-6 py-12">
        {/* Header */}
        <motion.div {...fadeInUp} className="mb-16">
          <div className="flex items-center gap-3 mb-4 font-mono text-xs text-gray-500">
            <span className="text-cyan-400">&gt;</span>
            <span>cat /environment/config.json</span>
          </div>

          <h1 className="heading-1 mb-6">
            <span className="text-gradient-tech">Environment</span>
          </h1>

          <p className="body-large max-w-3xl">
            A technical breakdown of my setup, stack, and systems — from infrastructure to instruments.
          </p>
        </motion.div>

        {/* Core Identity */}
        <motion.div
          {...fadeInUp}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 mb-8"
        >
          <h2 className="heading-3 mb-6 flex items-center gap-3">
            <span className="text-cyan-400">{'//'}</span>
            <span>Core Identity</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="font-mono text-xs text-gray-600 mb-2">role:</div>
              <div className="text-gray-300 font-medium">Platform / DevOps Engineer</div>
            </div>

            <div>
              <div className="font-mono text-xs text-gray-600 mb-2">location:</div>
              <div className="text-gray-300 font-medium" my-first-post-in-my-personal-blog>Remote / Distributed</div>
            </div>

            <div>
              <div className="font-mono text-xs text-gray-600 mb-2">timezone:</div>
              <div className="text-gray-300 font-medium">UTC+7 (Southeast Asia)</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="font-mono text-xs text-gray-600 mb-3">bio:</div>
            <p className="text-gray-400 leading-relaxed">
              I build and maintain cloud infrastructure, automate everything that can be automated,
              and obsess over system reliability. When I&apos;m not deploying to production,
              I&apos;m composing music or grinding ranked games. This blog is my outlet for
              personal stories across all three worlds.
            </p>
          </div>
        </motion.div>

        {/* Tech Stack */}
        <motion.div
          {...fadeInUp}
          transition={{ delay: 0.2 }}
          className="glass-card p-8 mb-8"
        >
          <h2 className="heading-3 mb-6 flex items-center gap-3">
            <span className="text-cyan-400">{'//'}</span>
            <span>Tech Stack</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {techStack.map((section, idx) => (
              <div key={idx}>
                <div className="font-mono text-xs text-cyan-400 mb-3">{section.category}</div>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="text-sm text-gray-400 flex items-center gap-2">
                      <span className="text-gray-700">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Music Setup */}
        <motion.div
          {...fadeInUp}
          transition={{ delay: 0.3 }}
          className="glass-card p-8 mb-8"
        >
          <h2 className="heading-3 mb-6 flex items-center gap-3">
            <span className="text-purple-400">{'//'}</span>
            <span>Music Setup</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {musicGear.map((item, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <div>
                  <div className="font-mono text-sm text-purple-400 mb-1">{item.name}</div>
                  <div className="text-sm text-gray-400">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="font-mono text-xs text-gray-600 mb-3">philosophy:</div>
            <p className="text-gray-400 text-sm">
              Music is code for the soul. Every composition is debugging emotions.
              Lofi beats help me focus while coding. Guitar riffs help me process the day.
              Piano melodies help me find clarity.
            </p>
          </div>
        </motion.div>

        {/* Gaming Profile */}
        <motion.div
          {...fadeInUp}
          transition={{ delay: 0.4 }}
          className="glass-card p-8 mb-8"
        >
          <h2 className="heading-3 mb-6 flex items-center gap-3">
            <span className="text-amber-400">{'//'}</span>
            <span>Gaming Profile</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {gamingSetup.map((item, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2"></div>
                <div>
                  <div className="font-mono text-sm text-amber-400 mb-1">{item.name}</div>
                  <div className="text-sm text-gray-400">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="font-mono text-xs text-gray-600 mb-3">mindset:</div>
            <p className="text-gray-400 text-sm">
              Competitive gaming teaches resilience. Every loss is a learning opportunity.
              Every win is validation of growth. Solo queue is brutal, but it mirrors life —
              you can&apos;t control your teammates, only your own gameplay and mental state.
            </p>
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          {...fadeInUp}
          transition={{ delay: 0.5 }}
          className="glass-card p-8"
        >
          <h2 className="heading-3 mb-6 flex items-center gap-3">
            <span className="text-cyan-400">{'//'}</span>
            <span>Connect</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="https://github.com/gryffin-uit-alpha"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 hover:border-cyan-500/50 rounded text-center text-sm text-gray-400 hover:text-cyan-400 font-mono transition-all"
            >
              [ GitHub ]
            </a>

            <a
              href="https://www.linkedin.com/in/gryffin-uit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 hover:border-cyan-500/50 rounded text-center text-sm text-gray-400 hover:text-cyan-400 font-mono transition-all"
            >
              [ LinkedIn ]
            </a>

            <a
              href="https://www.facebook.com/ahihihngblong"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 hover:border-purple-500/50 rounded text-center text-sm text-gray-400 hover:text-purple-400 font-mono transition-all"
            >
              [ Facebook ]
            </a>

            <a
              href="https://discord.gg/GYXnTt7BSv"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 hover:border-amber-500/50 rounded text-center text-sm text-gray-400 hover:text-amber-400 font-mono transition-all"
            >
              [ Discord ]
            </a>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-sm text-gray-500 text-center font-mono">
              <span className="text-gray-700">&gt;</span> Feel free to reach out. I&apos;m always down to talk about infrastructure, music production, or the state of solo queue.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
