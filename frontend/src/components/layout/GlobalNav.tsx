'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import SearchBar from '@/components/search/SearchBar';

const navItems = [
  { label: 'Log_Files', href: '/articles', color: 'cyan' },
  { label: 'Synthesizer', href: '/categories', color: 'purple' },
  { label: 'Match_History', href: '/tags', color: 'amber' },
  { label: 'Environment', href: '/about', color: 'cyan' },
];

export function GlobalNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showTerminal, setShowTerminal] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [terminalInput, setTerminalInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '> System initialized. Type "help" or click a quick command below.'
  ]);

  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setHidden(true);
        } else {
          setHidden(false);
        }

        setLastScrollY(currentScrollY);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);
      return () => window.removeEventListener('scroll', controlNavbar);
    }
  }, [lastScrollY]);

  useEffect(() => {
    if (showTerminal) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showTerminal, terminalOutput]);

  const handleTerminalCommand = (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryPointer(-1);

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    const fullArg = args.join(' ').toLowerCase();

    let outputLines: string[] = [];

    switch (command) {
      case 'help':
      case '?':
      case 'commands':
        outputLines = [
          '╔══════════════════════════════════════════════════════════════╗',
          '║               GRYFFIN CYBER-TERMINAL v2.4.0                 ║',
          '╚══════════════════════════════════════════════════════════════╝',
          '',
          '[ DevOps & Cloud Infrastructure ]',
          '  neofetch       System specs, kernel, container runtime & memory',
          '  k8s / kubectl  Inspect Kubernetes pods & cluster health',
          '  docker / ps    List running Docker microservices & ports',
          '  terraform / tf Show Terraform IaC status & state drift',
          '  git            Check git repository status & recent commits',
          '  stack          Show full architecture & tech stack',
          '',
          '[ Blog & Exploration ]',
          '  articles / ls  List latest articles & publication logs',
          '  categories     List content synthesizers (DevOps, Music, Gaming)',
          '  tags           Explore technical & vibe taxonomy',
          '  goto <page>    Navigate (e.g. goto articles, goto about, goto admin)',
          '  open <slug>    Directly open an article (e.g. open devops-article)',
          '  stats          View blog metrics, DB latency & cache hit rates',
          '',
          '[ Persona & Soundscapes ]',
          '  whoami         Inspect user identity & security context',
          '  about          Engineering mission, background & philosophy',
          '  mood           Current vibe state & mental frequency',
          '  music / lofi   Now playing soundscapes & lofi playlist',
          '  game / lol     Competitive gaming profile, champion pool & rank',
          '  socials        Connect across GitHub, LinkedIn, Spotify, Discord',
          '',
          '[ Utilities & Easter Eggs ]',
          '  ping           Check system latency & response rate',
          '  curl [url]     Simulate HTTP request to health/api endpoints',
          '  matrix         Stream digital cyber matrix sequence',
          '  quote          Retrieve developer & philosopher quotes',
          '  history        View previous commands entered in this session',
          '  sudo [cmd]     Execute with simulated superuser privileges',
          '  clear          Flush terminal output buffer',
          '  exit / quit    Close terminal session',
        ];
        break;

      case 'neofetch':
      case 'fastfetch':
      case 'systeminfo':
        outputLines = [
          '    .------------------------.      gryffin@cyber-matrix',
          '    |   /\\_/\\    [GRYFFIN]   |      --------------------',
          '    |  ( ^.^ )   DEV-OPS     |      OS: CyberOS 6.8.0-devops (x86_64)',
          '    |   > ^ <    PLATFORM    |      Host: MyBlogSpot Cloud Matrix Node',
          '    \'------------------------\'      Kernel: Linux 6.8.0-cloud-native',
          '                                    Uptime: 42d 13h 37m',
          '                                    Shell: zsh 5.9 (cyber-theme)',
          '                                    Terminal: gryffin-xterm-256color',
          '                                    Stack: Go 1.26 | Next.js 14 | PostgreSQL 15 | Redis 7',
          '                                    Cluster: AWS EKS (Spot Nodes + Karpenter)',
          '                                    GitOps: ArgoCD v2.10 (Synced / Healthy)',
          '                                    CPU: 16x AMD EPYC 7R13 @ 3.6GHz',
          '                                    Memory: 1024MiB / 8192MiB (12.5% used)',
          '                                    Mood State: [ OVERCLOCK ]',
        ];
        break;

      case 'k8s':
      case 'kubectl':
        outputLines = [
          '[i] Context: arn:aws:eks:ap-southeast-1:cluster/myblogspot-prod | Namespace: production',
          '',
          'NAME                                   READY   STATUS    RESTARTS   AGE     IP',
          'myblogspot-backend-79c8d5b4f-8x2kp     1/1     Running   0          42h     10.0.3.45',
          'myblogspot-backend-79c8d5b4f-9m7pq     1/1     Running   0          42h     10.0.4.12',
          'myblogspot-frontend-5b4d7f8d9-2m9vt    1/1     Running   0          18h     10.0.3.89',
          'myblogspot-frontend-5b4d7f8d9-6k4lp    1/1     Running   0          18h     10.0.4.77',
          'myblogspot-postgres-statefulset-0      1/1     Running   0          5d      10.0.5.21',
          'myblogspot-redis-replica-0             1/1     Running   0          5d      10.0.5.33',
          'argocd-server-6789bf896-pq9zl          1/1     Running   0          12d     10.0.2.14',
          'external-secrets-operator-58b8f        1/1     Running   0          12d     10.0.2.80',
          '',
          '✔ 8/8 pods in Running state. Zero restart count across production namespaces.',
        ];
        break;

      case 'docker':
      case 'ps':
        outputLines = [
          'CONTAINER ID   IMAGE                 COMMAND                  STATUS         PORTS',
          'e915de1118ea   myblogspot-backend    "/app/server"            Up 2 hours     0.0.0.0:8080->8080/tcp',
          '29fa1b08105b   myblogspot-frontend   "docker-entrypoint.s…"   Up 30 mins     0.0.0.0:3000->3000/tcp',
          'e88e99afd4d2   postgres:15-alpine    "docker-entrypoint.s…"   Up 4 hours     0.0.0.0:5432->5432/tcp (healthy)',
          'a1c2797587d0   redis:7-alpine        "docker-entrypoint.s…"   Up 4 hours     0.0.0.0:6379->6379/tcp (healthy)',
          'e66213bf08a2   dpage/pgadmin4        "/entrypoint.sh"         Up 4 hours     0.0.0.0:5050->80/tcp',
          '',
          '✔ 5 active containers running on local bridge network "myblogspot-net".',
        ];
        break;

      case 'terraform':
      case 'tf':
        outputLines = [
          '[i] Initializing Terraform in /infra/environments/production...',
          '[i] Backend: S3 (bucket: myblogspot-tfstate, dynamodb_lock: myblogspot-tflocks)',
          '[+] AWS Provider v5.50.0 initialized.',
          '',
          'Terraform will perform the following actions:',
          '  # module.eks.aws_eks_cluster.prod will be updated in-place',
          '  ~ version: "1.29" -> "1.30"',
          '  # module.ssm.aws_ssm_parameter.app_secrets will be synced',
          '  + aws_ssm_parameter.jwt_secret (SecureString / KMS encrypted)',
          '  + aws_kms_key.app_key (AES-256 GCM)',
          '',
          'Plan: 2 to add, 1 to change, 0 to destroy.',
          '✔ State lock acquired & verified. Zero drift detected.',
        ];
        break;

      case 'git':
        outputLines = [
          'On branch main',
          'Your branch is up to date with \'origin/main\'.',
          '',
          'Changes:',
          '  ✔ frontend/src/components/layout/GlobalNav.tsx (Interactive Cyber Terminal Extended)',
          '  ✔ frontend/tailwind.config.js (High-contrast typography)',
          '  ✔ .github/workflows/ci.yml (Gitleaks, Trivy, Cosign, Syft SBOM)',
          '  ✔ config/helm/myblogspot (Production-ready Helm charts)',
          '',
          'Nothing to commit, working tree clean.',
          'Latest Commit: feat(terminal): supercharge [>_] with devops, navigation & interactive commands',
        ];
        break;

      case 'stack':
      case 'tech':
      case 'architecture':
        outputLines = [
          '╔══════════════════════════════════════════════════════════════╗',
          '║                 MYBLOGSPOT CLOUD ARCHITECTURE                ║',
          '╚══════════════════════════════════════════════════════════════╝',
          '• Backend:       Go 1.26 (Chi Router, clean architecture, zero-alloc)',
          '• Frontend:      Next.js 14 App Router, React 18, Tailwind CSS, Framer Motion',
          '• Database:      PostgreSQL 15 (pgx/v5 connection pool, sqlc, FTS ts_rank)',
          '• Cache:         Redis 7 (Distributed sessions & tag invalidation)',
          '• Container:     Docker multi-stage (Distroless nonroot runtime, <25MB)',
          '• Orchestration: Kubernetes (AWS EKS), Helm 3, Karpenter autoscaler',
          '• Security:      Trivy container scan, Gitleaks, Cosign keyless, AWS SSM+KMS',
          '• GitOps:        ArgoCD continuous delivery with automated sync',
        ];
        break;

      case 'articles':
      case 'ls':
      case 'dir':
      case 'log_files':
        outputLines = [
          'Available Log Files (Articles):',
          '  [01] devops-article        | DevOps & Cloud Native Architecture      | #Critical #Docker #Kubernetes',
          '  [02] lo-fi-beats-coding    | Composing Lo-Fi Beats for Late Nights   | #Ambient #Music #Production',
          '  [03] climbing-the-ladder   | Jungle Psychology: From Tilt to Diamond | #Overclock #Gaming #League',
          '',
          '💡 Tip: Type "goto articles" or "open <slug>" to view.',
        ];
        break;

      case 'categories':
      case 'synthesizer':
        outputLines = [
          'Content Synthesizers (Categories):',
          '  • devops    | Systems architecture, containers, k8s & cloud infrastructure',
          '  • music     | Guitar chords, synth design, lo-fi arrangements & audio theory',
          '  • gaming    | Solo queue strategy, macro gameplay & mental resilience',
          '  • tutorials | Hands-on step-by-step technical implementation guides',
          '',
          '💡 Tip: Type "goto categories" to browse.',
        ];
        break;

      case 'tags':
      case 'match_history':
        outputLines = [
          'Active Vibes & Technical Taxonomy:',
          '  Vibe States:',
          '    [ CRITICAL ]   High-intensity, deep technical architecture & outages',
          '    [ AMBIENT ]    Relaxed lo-fi flow, audio textures & reflective thoughts',
          '    [ OVERCLOCK ]  Ranked grind, performance tuning & adrenalized focus',
          '',
          '  Technical Tags:',
          '    #Docker #Kubernetes #Golang #Terraform #AWS #PostgreSQL #Redis #NextJS',
          '',
          '💡 Tip: Type "goto tags" to filter articles by tag.',
        ];
        break;

      case 'goto':
      case 'cd':
        if (!fullArg || fullArg === '~' || fullArg === '/') {
          router.push('/');
          outputLines = ['[+] Navigating to Home [ / ]...'];
        } else if (fullArg.includes('article') || fullArg === 'articles' || fullArg === 'log_files') {
          router.push('/articles');
          outputLines = ['[+] Navigating to Articles [ /articles ]...'];
        } else if (fullArg.includes('cat') || fullArg === 'categories' || fullArg === 'synthesizer') {
          router.push('/categories');
          outputLines = ['[+] Navigating to Categories [ /categories ]...'];
        } else if (fullArg.includes('tag') || fullArg === 'tags' || fullArg === 'match_history') {
          router.push('/tags');
          outputLines = ['[+] Navigating to Tags [ /tags ]...'];
        } else if (fullArg.includes('about') || fullArg === 'environment') {
          router.push('/about');
          outputLines = ['[+] Navigating to Environment [ /about ]...'];
        } else if (fullArg.includes('admin') || fullArg === 'login') {
          router.push('/admin/login');
          outputLines = ['[+] Navigating to Admin Portal [ /admin/login ]...'];
        } else {
          router.push(`/${fullArg}`);
          outputLines = [`[+] Navigating to /${fullArg}...`];
        }
        break;

      case 'open':
        if (!fullArg) {
          outputLines = ['[!] Usage: open <article-slug> (e.g. open devops-article)'];
        } else {
          router.push(`/articles/${fullArg}`);
          outputLines = [`[+] Opening article: /articles/${fullArg}...`];
        }
        break;

      case 'whoami':
        outputLines = [
          'User:        gryffin (uid=1000, gid=1000, groups=devops,musicians,gamers)',
          'Roles:       Platform Engineer | Guitarist & Producer | Jungle Solo-Queue Main',
          'Host:        cyber-matrix.local',
          'Clearance:   LEVEL 5 [ROOT ACCESS]',
          'Location:    Ho Chi Minh City, Vietnam (UTC+7)',
        ];
        break;

      case 'about':
      case 'bio':
        outputLines = [
          'Personal stories from a DevOps engineer who codes, plays music, and games.',
          'This space documents the intersection of three disciplines:',
          '  1. High-reliability distributed systems & Cloud Platform engineering.',
          '  2. Atmospheric music composition, jazz guitar harmonies & synth sound design.',
          '  3. Competitive esports discipline, game theory & clutch decision-making.',
          '',
          'Crafted with Go, Next.js, and Kubernetes. Zero bloat, pure signal.',
        ];
        break;

      case 'mood':
      case 'vibe':
        outputLines = [
          'Current Vibe State: [ OVERCLOCK ]',
          '• Mental State: Laser-focused flow mode',
          '• Background Soundtrack: Lo-fi hip hop tape in D minor',
          '• Terminal Session: Active & responsive',
          '• Coffee Level: 87% (Dark Roast)',
        ];
        break;

      case 'music':
      case 'lofi':
      case 'playlist':
        outputLines = [
          '╔══════════════════════════════════════════════════════════════╗',
          '║                   CURRENT AUDIO STREAM                       ║',
          '╚══════════════════════════════════════════════════════════════╝',
          '♪ Track:       Neon Highway (Midnight Session)',
          '♪ Artist:      Gryffin & The Cyber Collective',
          '♪ Key / Tempo: D Minor • 84 BPM',
          '♪ Instruments: Fender Stratocaster Clean Tone • Roland Juno-106 Synth Bass',
          '♪ Preset:      Analog Tape Saturation + 1/4 Dotted Stereo Delay',
          '♪ Mood State:  [ AMBIENT ] • Deep coding focus engaged.',
        ];
        break;

      case 'game':
      case 'gaming':
      case 'lol':
      case 'rank':
        outputLines = [
          '╔══════════════════════════════════════════════════════════════╗',
          '║                   SUMMONER DOSSIER                           ║',
          '╚══════════════════════════════════════════════════════════════╝',
          '• IGN:          Gryffin #UIT',
          '• Primary Role: Jungle (Tempo & Map Controller)',
          '• Pool:         Lee Sin (Insec kick ready), Viego (Reset machine), Jarvan IV',
          '• Current Tier: Diamond I (78 LP)',
          '• Win Rate:     58.4% (Season 14)',
          '• Golden Rule:  "Never contest elder dragon without mid-lane wave priority."',
          '• Mental State: Iron-clad. Mute ping spammers, track camps, secure objectives.',
        ];
        break;

      case 'socials':
      case 'contact':
        outputLines = [
          'Connect with Gryffin across the digital matrix:',
          '  • GitHub:    github.com/gryffin-uit-alpha',
          '  • LinkedIn:  linkedin.com/in/gryffin-devops',
          '  • Spotify:   spotify.com/artist/gryffin-lofi',
          '  • Discord:   discord.gg/cyber-lounge',
          '  • Location:  /about (Environment page)',
        ];
        break;

      case 'stats':
        outputLines = [
          'MyBlogSpot Cluster Telemetry:',
          '  • HTTP Status:      200 OK (p99 latency: 1.2ms)',
          '  • Database Pool:    PostgreSQL 15 (Active: 10, Idle: 5, Max: 25)',
          '  • Cache Hit Rate:   Redis 7 (98.4% hit ratio)',
          '  • Articles:         Active & indexed with full-text search ts_rank',
          '  • Image Security:   0 CRITICAL / 0 HIGH vulnerabilities (Trivy scanned)',
          '  • Container:        Distroless nonroot runtime (<25MB image size)',
        ];
        break;

      case 'ping':
        outputLines = [
          'PING matrix.myblogspot.local (127.0.0.1): 56 data bytes',
          '64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.428 ms',
          '64 bytes from 127.0.0.1: icmp_seq=2 ttl=64 time=0.312 ms',
          '64 bytes from 127.0.0.1: icmp_seq=3 ttl=64 time=0.365 ms',
          '--- matrix.myblogspot.local ping statistics ---',
          '3 packets transmitted, 3 packets received, 0.0% packet loss',
          'round-trip min/avg/max = 0.312/0.368/0.428 ms',
        ];
        break;

      case 'curl':
        outputLines = [
          '> GET /api/v1/health HTTP/1.1',
          '< HTTP/1.1 200 OK',
          '< Content-Type: application/json',
          '< X-Powered-By: Go Chi & Next.js',
          '{',
          '  "status": "healthy",',
          '  "database": "connected",',
          '  "redis": "connected",',
          '  "version": "v1.2.0-cloud-native",',
          '  "uptime_seconds": 367200',
          '}',
        ];
        break;

      case 'matrix':
        outputLines = [
          '01000111 01010010 01011001 01000110 01000110 01001001 01001110',
          'Wake up, Neo...',
          'The Matrix has you.',
          'Follow the white rabbit.',
          'Knock, knock, Gryffin.',
          '[+] Neural link established: 100 Gbps connection to matrix core.',
        ];
        break;

      case 'quote':
      case 'inspire':
        const quotes = [
          '"Talk is cheap. Show me the code." — Linus Torvalds',
          '"Simplicity is prerequisite for reliability." — Edsger W. Dijkstra',
          '"In the middle of difficulty lies opportunity." — Albert Einstein',
          '"It is not enough for code to work. It must be clean." — Robert C. Martin',
          '"The only true defeat is giving up before the Nexus explodes." — Solo Q Proverb',
          '"Music is the silence between the notes." — Claude Debussy',
        ];
        outputLines = [quotes[Math.floor(Math.random() * quotes.length)]];
        break;

      case 'history':
        outputLines = commandHistory.length > 0
          ? commandHistory.map((h, idx) => `  ${idx + 1}  ${h}`)
          : ['No history recorded yet in this session.'];
        break;

      case 'sudo':
        outputLines = [
          '[!] ACCESS GRANTED: User "gryffin" is already root.',
          'With great power comes great responsibility. Zero incidents reported.',
        ];
        break;

      case 'date':
      case 'time':
        outputLines = [`Current Server Time: ${new Date().toISOString()}`];
        break;

      case 'uptime':
        outputLines = ['Uptime: 42 days, 13 hours, 37 minutes, 0 errors logged.'];
        break;

      case 'echo':
        outputLines = [args.join(' ')];
        break;

      case 'exit':
      case 'quit':
      case ':q':
        setShowTerminal(false);
        return;

      case 'clear':
      case 'cls':
        setTerminalOutput(['> System initialized. Type "help" or click a quick command below.']);
        return;

      default:
        outputLines = [
          `Command not found: "${trimmed}".`,
          'Type "help" to see available commands or click a quick command below.',
        ];
    }

    setTerminalOutput((prev) => [...prev, `> ${trimmed}`, ...outputLines]);
  };

  const getLineStyle = (line: string) => {
    if (line.startsWith('>')) return 'text-[#22D3EE] font-bold';
    if (line.startsWith('✔') || line.startsWith('[+]') || line.startsWith('[SUCCESS]')) return 'text-emerald-400 font-medium';
    if (line.startsWith('⚠') || line.startsWith('[!]') || line.startsWith('[WARN]')) return 'text-amber-400 font-medium';
    if (line.startsWith('✖') || line.startsWith('[-]') || line.startsWith('[ERR]')) return 'text-rose-400 font-medium';
    if (line.startsWith('[i]') || line.startsWith('💡') || line.startsWith('INFO')) return 'text-cyan-300';
    if (line.startsWith('♪') || line.startsWith('⚔') || line.startsWith('▲')) return 'text-purple-400 font-medium';
    if (line.startsWith('╔') || line.startsWith('║') || line.startsWith('╚') || line.startsWith('══') || line.startsWith('---') || line.startsWith('===') || line.startsWith('•') || line.startsWith('  [')) return 'text-cyan-200/90';
    if (line.startsWith('#') || line.startsWith('//')) return 'text-gray-500';
    return 'text-slate-200';
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'cyan': return 'text-[#22D3EE] hover:text-[#22D3EE]/80';
      case 'purple': return 'text-[#8B5CF6] hover:text-[#8B5CF6]/80';
      case 'amber': return 'text-[#F59E0B] hover:text-[#F59E0B]/80';
      default: return 'text-gray-400 hover:text-gray-300';
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: hidden ? '-100%' : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#0B0F19]/70 backdrop-blur-xl border-b border-white/5"
      >
        <div className="container-wide mx-auto">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-[#22D3EE] to-[#8B5CF6] rounded-md flex items-center justify-center font-mono font-bold text-[#0B0F19] transition-transform group-hover:scale-105">
                G
              </div>
              <span className="font-mono text-sm text-gray-400 group-hover:text-gray-300 transition-colors whitespace-nowrap">
                <span className="text-gray-600">[</span> GRYFFIN <span className="text-gray-600">]</span>
              </span>
            </Link>

            {/* Main Navigation */}
            <div className="hidden md:flex items-center gap-1 shrink-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative px-3.5 py-2 font-mono text-xs transition-colors whitespace-nowrap shrink-0
                      ${isActive ? getColorClass(item.color) : 'text-gray-500 hover:text-gray-300'}
                    `}
                  >
                    <span className="text-gray-600">[</span> {item.label} <span className="text-gray-600">]</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6]"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <SearchBar expandable={true} />

              <button
                onClick={() => setShowTerminal(!showTerminal)}
                className="px-3 py-1.5 font-mono text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-900/60 hover:border-cyan-400/50 bg-cyan-950/20 rounded transition-all shrink-0 whitespace-nowrap"
                title="Open Cyber Terminal [>_]"
                aria-label="Open Terminal"
              >
                <span className="text-gray-500">[</span> &gt;_ <span className="text-gray-500">]</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scroll Progress Bar */}
        <motion.div
          style={{ width: progressWidth }}
          className="h-0.5 bg-gradient-to-r from-[#22D3EE] via-[#8B5CF6] to-[#F59E0B]"
        />
      </motion.nav>

      {/* Terminal Overlay */}
      <AnimatePresence>
        {showTerminal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowTerminal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-[#0B0F19] border border-[#22D3EE]/30 rounded-lg w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Terminal Header */}
              <div className="flex items-center justify-between border-b border-gray-800/90 px-5 py-3 bg-[#080d18]">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/70 hover:opacity-100 cursor-pointer" onClick={() => setShowTerminal(false)} />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  </div>
                  <span className="font-mono text-xs text-gray-400">
                    zsh — gryffin@cyber-matrix:~/myblogspot <span className="text-cyan-400">(main)</span>
                  </span>
                </div>
                <button
                  onClick={() => setShowTerminal(false)}
                  className="text-gray-400 hover:text-white transition-colors text-sm px-1.5 py-0.5 rounded hover:bg-gray-800/60"
                  aria-label="Close terminal"
                >
                  ✕
                </button>
              </div>

              {/* Terminal Output */}
              <div className="p-5 flex-1 min-h-[300px] max-h-[460px] overflow-y-auto font-mono text-xs sm:text-sm space-y-1.5 select-text">
                {terminalOutput.map((line, i) => (
                  <div key={i} className={`${getLineStyle(line)} whitespace-pre-wrap leading-relaxed`}>
                    {line}
                  </div>
                ))}

                {/* Input Line */}
                <div className="flex items-center gap-2 text-[#22D3EE] pt-3 pb-1">
                  <span className="font-bold select-none">&gt;</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleTerminalCommand(terminalInput);
                        setTerminalInput('');
                      } else if (e.key === 'Escape') {
                        setShowTerminal(false);
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (commandHistory.length > 0) {
                          const nextPtr = historyPointer === -1 ? commandHistory.length - 1 : Math.max(0, historyPointer - 1);
                          setHistoryPointer(nextPtr);
                          setTerminalInput(commandHistory[nextPtr]);
                        }
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (historyPointer !== -1) {
                          const nextPtr = historyPointer + 1;
                          if (nextPtr < commandHistory.length) {
                            setHistoryPointer(nextPtr);
                            setTerminalInput(commandHistory[nextPtr]);
                          } else {
                            setHistoryPointer(-1);
                            setTerminalInput('');
                          }
                        }
                      }
                    }}
                    className="flex-1 bg-transparent outline-none text-gray-200 placeholder-gray-600 font-mono text-xs sm:text-sm"
                    placeholder="Type command ('help', 'neofetch', 'k8s', 'docker', 'articles')..."
                    autoFocus
                  />
                </div>
                <div ref={terminalBottomRef} />
              </div>

              {/* Quick Command Chips */}
              <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5 bg-[#080d18] border-t border-gray-800/80 text-xs">
                <span className="text-gray-500 font-mono text-[10px] uppercase tracking-wider mr-1 shrink-0">Quick Run:</span>
                {[
                  'help',
                  'neofetch',
                  'k8s',
                  'docker',
                  'tf',
                  'stack',
                  'articles',
                  'categories',
                  'tags',
                  'music',
                  'game',
                  'stats',
                  'ping',
                  'matrix',
                  'clear',
                ].map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => handleTerminalCommand(cmd)}
                    className="px-2 py-0.5 font-mono text-[11px] text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/50 hover:border-cyan-400/70 rounded transition-all active:scale-95"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed nav */}
      <div className="h-16" />
    </>
  );
}

