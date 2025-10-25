import { useState } from 'react';
import NavBar from '../components/NavBar';

const pendientes = [
  { id: 'INC-2025-003', title: 'Estacionamiento indebido', date: '2025-10-22', hash: '0x7f3a9b2c...' },
  { id: 'INC-2025-005', title: 'Invasión de carril', date: '2025-10-22', hash: '0x1a2b3c4d...' },
];

export default function RevealPage() {
  const [selected, setSelected] = useState<typeof pendientes[0] | null>(null);
  const [cid, setCid] = useState('');
  const [salt, setSalt] = useState('');
  const [busy, setBusy] = useState(false);

  function pick(x: typeof pendientes[0]) { setSelected(x); setCid(''); setSalt(''); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      alert(`Reveal (demo)
id: ${selected.id}
cid: ${cid}
salt: ${salt}`);
      // Luego: makeContractCall(reveal_incident, {commitId, cid, salt})
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <NavBar active="/reveal" />
      <main className="max-w-5xl mx-auto px-4 py-10 grid gap-8">
        <div>
          <h1 className="text-3xl font-extrabold text-green-400">Revelar Incidente</h1>
          <p className="text-slate-400">Publica la evidencia completa de tus incidentes registrados</p>
        </div>

        <section className="grid gap-4">
          <h2 className="text-2xl font-bold text-green-300">Incidentes pendientes de revelar</h2>
          <div className="grid gap-4">
            {pendientes.map(p => (
              <div key={p.id} className="bg-[#121a2b] border border-white/10 rounded-2xl p-5">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-slate-300 text-sm">ID: {p.id} <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-500 text-black rounded-full">Pendiente</span></div>
                    <div className="font-semibold">{p.title}</div>
                    <div className="text-slate-400 text-sm">Fecha: {p.date}</div>
                  </div>
                  <button onClick={() => pick(p)} className="px-3 py-2 rounded bg-white/10 hover:bg-white/15">Revelar</button>
                </div>
                <div className="mt-3 text-xs text-slate-300 break-all"><b>Hash de compromiso</b><br/>{p.hash}</div>
              </div>
            ))}
          </div>
        </section>

        {selected && (
          <form onSubmit={onSubmit} className="bg-[#121a2b] border border-green-500/30 rounded-2xl p-6 grid gap-4">
            <h3 className="text-xl font-bold text-green-400">Revelar evidencia para {selected.id}</h3>

            <div className="grid gap-2">
              <label className="text-slate-300">CID / IPFS Hash</label>
              <input className="bg-[#0e1627] border border-white/10 rounded px-3 py-2"
                     placeholder="Qm... o bafybeixxx..." value={cid} onChange={e=>setCid(e.target.value)} />
              <div className="text-xs text-slate-400">El identificador IPFS de tu evidencia almacenada</div>
            </div>

            <div className="grid gap-2">
              <label className="text-slate-300">Salt (valor secreto)</label>
              <input className="bg-[#0e1627] border border-white/10 rounded px-3 py-2"
                     placeholder="Ingresa el salt usado al registrar" value={salt} onChange={e=>setSalt(e.target.value)} />
              <div className="text-xs text-slate-400">El valor secreto que usaste para crear el hash de compromiso</div>
            </div>

            <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-4 text-blue-200 text-sm">
              Al revelar, tu evidencia será pública y verificable por cualquier persona. Asegúrate de que los datos son correctos.
            </div>

            <div className="flex gap-3">
              <button disabled={busy} className="flex-1 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 font-semibold">
                {busy ? 'Revelando…' : 'Revelar evidencia'}
              </button>
              <button type="button" onClick={()=>setSelected(null)} className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
