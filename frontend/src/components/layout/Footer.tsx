'use client';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="relative bg-[#0B0F19]/70 backdrop-blur-xl border-t border-white/5 mt-auto z-40"
    >
      <div className="container-wide mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 font-mono text-xs">
          <div className="text-gray-400">
            <span className="text-gray-500">&gt;</span> © {currentYear} GRYFFIN <span className="text-gray-600">|</span> <span className="text-gray-500">status:</span> <span className="text-green-400">ONLINE</span>
          </div>

          <div className="flex gap-6">
            <a
              href="https://github.com/gryffin-uit-alpha"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-cyan-400 transition-colors"
            >
              [ GitHub ]
            </a>
            <a
              href="https://www.linkedin.com/in/gryffin-uit/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-cyan-400 transition-colors"
            >
              [ LinkedIn ]
            </a>
            <a
              href="https://www.facebook.com/ahihihngblong"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-purple-400 transition-colors"
            >
              [ Facebook ]
            </a>
            <a
              href="https://discord.gg/GYXnTt7BSv"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-purple-400 transition-colors"
            >
              [ Discord ]
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
