import { useState } from 'react';

export default function RevealForm() {
  const [commitId, setCommitId] = useState('');
  const [cid, setCid] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function uploadMock() {
    if (!file) return alert('Selecciona un archivo');
    setUploading(true);
    try {
      // Demo: pegamos al API local /api/upload y obtenemos un CID falso
      const res = await fetch('/api/upload', { method: 'POST' });
      const data = await res.json();
      setCid(data.cid);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!commitId || !cid) return alert('Falta Commit ID o CID');
    setSending(true);
    try {
      // Aquí irá makeContractCall(reveal_incident) cuando tengamos ABI
      alert(`Reveal enviado (demo).\ncommitId: ${commitId}\ncid: ${cid}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 max-w-xl">
      <h2 className="text-xl font-semibold">Revelar incidente (Reveal)</h2>

      <label className="grid gap-1">
        <span className="text-sm">Commit ID</span>
        <input className="border rounded px-2 py-1" value={commitId} onChange={e=>setCommitId(e.target.value)} placeholder="id del commit" />
      </label>

      <div className="grid md:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm">CID</span>
          <input className="border rounded px-2 py-1" value={cid} onChange={e=>setCid(e.target.value)} placeholder="ipfs://… o CID" />
        </label>

        <div className="grid gap-1">
          <span className="text-sm">o sube archivo (mock)</span>
          <input type="file" onChange={e=>setFile(e.target.files?.[0] || null)} />
          <button type="button" onClick={uploadMock}
                  className="px-3 py-1.5 bg-slate-200 rounded disabled:opacity-50"
                  disabled={!file || uploading}>
            {uploading ? 'Subiendo…' : 'Generar CID (demo)'}
          </button>
        </div>
      </div>

      <button type="submit" disabled={!commitId || !cid || sending}
              className="px-3 py-1.5 bg-blue-600 text-white rounded disabled:opacity-50">
        {sending ? 'Enviando…' : 'Reveal'}
      </button>
    </form>
  );
}
