import { PropsWithChildren } from 'react';

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100 relative">
      {/* patrón simple de fondo */}
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none"
           style={{ backgroundImage:
             'radial-gradient(transparent 1px,#0b1220 1px),radial-gradient(transparent 1px,#0b1220 1px)',
             backgroundSize: '60px 60px', backgroundPosition: '0 0,30px 30px' }} />
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md bg-[#121a2b] rounded-2xl shadow-xl border border-white/10 p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
