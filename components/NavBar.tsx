import Link from 'next/link';
import ConnectButton from './ConnectButton';
import { useWallet } from './WalletProvider';
import { clearAllForLogout } from '../lib/store';
import {
  Home,
  FilePlus2,
  Eye,
  Shield,
  TriangleAlert,
  LogOut,
} from 'lucide-react';

const items = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/registrar', label: 'Registrar', icon: FilePlus2 },
  { href: '/reveal', label: 'Revelar', icon: Eye },
  { href: '/denuncias', label: 'Denuncias', icon: TriangleAlert },
  { href: '/auditor', label: 'Auditor', icon: Shield },
];

export default function NavBar({ active = '' }: { active?: string }) {
  const { userSession } = useWallet();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur bg-[#0e1628]/80">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-green-600/90 grid place-items-center text-white shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <div className="text-[17px] font-semibold tracking-tight group-hover:text-white">
              SafeTraffic Ledger
            </div>
            <div className="text-[11px] text-slate-400">Blockchain Traffic Registry</div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="ml-auto hidden md:flex items-center gap-1">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition
              ${active === href ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Wallet + Logout */}
        <div className="ml-2 flex items-center gap-2">
          <ConnectButton />
          <button
            onClick={() => {
              try { userSession?.signUserOut?.(); } catch {}
              clearAllForLogout();
              window.location.href = '/login';
            }}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white px-2 py-2 rounded-lg hover:bg-white/5 transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
