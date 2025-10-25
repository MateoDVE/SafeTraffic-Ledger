import { useState } from 'react';
import NavBar from '../components/NavBar';
import { addReport } from '../lib/store';

export default function DenunciasPage() {
  const [desc, setDesc] = useState('');
  const [file, setFile] = useState<File|null>(null);
  const [busy, setBusy] = useState(false);

  
async function submit(e: React.FormEvent) {
  e.preventDefault();
  if (desc.trim().length < 50) return alert('Describe con al menos 50 caracteres.');
  setBusy(true);
  try {
    const id = `REP-${Date.now().toString().slice(-6)}`;
    addReport({
      id,
      description: desc.trim(),
      fileName: file?.name,
      timestamp: new Date().toISOString(),
    });
    setDesc('');
    (document.getElementById('file-input') as HTMLInputElement | null)?.value && ((document.getElementById('file-input') as HTMLInputElement).value = '');
    alert('Denuncia cifrada enviada (demo)');
  } finally { setBusy(false); }
}

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <NavBar active="/denuncias" />
      <main className="max-w-4xl mx-auto px-4 py-10 grid gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-red-400">Canal de Denuncias</h1>
          <p className="text-slate-400">Reporta irregularidades de forma anónima y segura</p>
        </div>

        <div className="rounded-xl border border-blue-400/40 bg-blue-500/10 text-blue-200 p-3 text-sm">
          🛡️ Tu identidad está protegida. Todas las denuncias son cifradas y anónimas.
        </div>

        <form onSubmit={submit} className="bg-[#121a2b] border border-white/10 rounded-2xl p-6 grid gap-5">
          <div className="grid gap-2">
            <label className="text-xl font-semibold text-red-300">Enviar denuncia anónima</label>
            <p className="text-slate-400 -mt-1">Describe la situación con el mayor detalle posible</p>
          </div>

          <div className="grid gap-2">
            <label className="text-slate-300">Descripción de la denuncia</label>
            <textarea className="bg-[#0e1627] border border-white/10 rounded px-3 py-2 h-40"
              placeholder="Describe la irregularidad… mínimo 50 caracteres"
              value={desc} onChange={e=>setDesc(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <label className="text-slate-300">Archivo adjunto (opcional)</label>
            <div className="h-28 border border-dashed border-white/20 rounded-xl grid place-items-center text-slate-400">
              <input type="file" onChange={e=>setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="text-xs text-slate-400">Los archivos serán cifrados antes de ser almacenados</div>
          </div>

          <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-yellow-200 text-sm">
            ⚠️ Solo denuncia situaciones reales y verificables. Las denuncias falsas pueden tener consecuencias legales.
          </div>

          <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-4 text-blue-200 text-sm">
            ✅ Garantías de privacidad:
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Tu dirección IP será anonimizada</li>
              <li>Todos los datos serán cifrados end-to-end</li>
              <li>No se almacenará información que pueda identificarte</li>
              <li>Acceso restringido solo al equipo de auditoría</li>
            </ul>
          </div>

          <button disabled={busy} className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 font-semibold">
            {busy ? 'Enviando…' : 'Enviar denuncia cifrada'}
          </button>
        </form>

        <div className="bg-[#121a2b] border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-slate-200">¿Qué puedes denunciar?</h3>
          <ul className="list-disc ml-5 mt-3 space-y-1 text-slate-300">
            <li>Manipulación de evidencias en incidentes registrados</li>
            <li>Corrupción o sobornos relacionados con infracciones de tránsito</li>
            <li>Mal uso del sistema por parte de autoridades o usuarios</li>
            <li>Irregularidades en la resolución de disputas</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
