import { useState } from 'react';
import { fileToArrayBuffer, sha256ArrayBuffer, sha256String } from '../lib/hash';

export default function CommitForm() {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({ timestamp: new Date().toISOString(), location: '', agentId: '' });
  const [evidenceHash, setEvidenceHash] = useState('');
  const [metaHash, setMetaHash] = useState('');
  const [sending, setSending] = useState(false);

  async function computeHashes() {
    if (!file) return alert('Selecciona un archivo de evidencia');
    const buf = await fileToArrayBuffer(file);
    const eh = await sha256ArrayBuffer(buf);
    const mh = await sha256String(JSON.stringify(meta));
    setEvidenceHash(eh);
    setMetaHash(mh);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!evidenceHash || !metaHash) return alert('Primero calcula los hashes');
    setSending(true);
    try {
      // Aquí irá makeContractCall(...) cuando tu amigo comparta el ABI
      alert('Commit enviado (demo). Integramos contrato cuando tengamos ABI/args.');
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 max-w-xl">
      <h2 className="text-xl font-semibold">Registrar incidente (Commit)</h2>

      <label className="grid gap-1">
        <span className="text-sm">Evidencia (archivo)</span>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </label>

      <div className="grid md:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm">Ubicación</span>
          <input className="border rounded px-2 py-1" value={meta.location}
                 onChange={e => setMeta(m => ({...m, location: e.target.value}))}/>
        </label>
        <label className="grid gap-1">
          <span className="text-sm">ID de Agente</span>
          <input className="border rounded px-2 py-1" value={meta.agentId}
                 onChange={e => setMeta(m => ({...m, agentId: e.target.value}))}/>
        </label>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={computeHashes} className="px-3 py-1.5 bg-slate-200 rounded">
          Calcular hashes
        </button>
        <button type="submit" disabled={!evidenceHash || !metaHash || sending}
                className="px-3 py-1.5 bg-blue-600 text-white rounded disabled:opacity-50">
          {sending ? 'Enviando…' : 'Commit'}
        </button>
      </div>

      {evidenceHash && <div className="text-xs break-all"><b>evidenceHash:</b> {evidenceHash}</div>}
      {metaHash && <div className="text-xs break-all"><b>metaHash:</b> {metaHash}</div>}
    </form>
  );
}
