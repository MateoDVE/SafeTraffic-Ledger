import { useState } from 'react';
import NavBar from '../components/NavBar';
import { fileToArrayBuffer, sha256ArrayBuffer, sha256String } from '../lib/hash';
import { addIncident } from '../lib/store';

import { useConnect } from '@stacks/connect-react';
import { commitIncident } from '../lib/stacks';
import { useWallet } from '../components/WalletProvider';

const INCIDENT_TYPES: Record<string, number> = {
  Colisión: 1,
  'Exceso de velocidad': 2,
  'Estacionamiento indebido': 3,
  'Semáforo en rojo': 4,
  'Invasión de carril': 5,
};
const DEFAULT_INCIDENT_TYPE = 99;

export default function RegistrarPage() {
  const [file, setFile] = useState<File | null>(null);
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [plate, setPlate] = useState('');
  const [notes, setNotes] = useState('');
  const [hash, setHash] = useState('');
  const [busy, setBusy] = useState(false);

  const { doContractCall } = useConnect();
  const { userSession } = useWallet();
  const userData = userSession.isUserSignedIn() ? userSession.loadUserData() : null;
  const senderAddress =
    userData?.profile?.stxAddress?.testnet || userData?.profile?.stxAddress?.mainnet || '';

  async function useCurrentLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`),
      () => alert('No se pudo obtener ubicación'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return alert('Sube una evidencia');
    if (!senderAddress) return alert('Debes conectar tu wallet para registrar.');
    setBusy(true);

    try {
      // 1. Calcular hashes de evidencia
      const buf = await fileToArrayBuffer(file);
      const evidenceHash = await sha256ArrayBuffer(buf);
      setHash(evidenceHash);

      // 2. Preparar y hashear metadatos para meta-hash
      const metaData = {
        location: location || '—',
        plate: plate || '—',
        type: type || 'Incidente',
        timestamp: new Date().toISOString(),
        notes: notes || '—',
      };
      const metaHash = await sha256String(JSON.stringify(metaData));

      // 3. Generar geo-hash
      const geoHash = await sha256String(metaData.location);

      // 4. Mapear tipo a UINT
      const incidentTypeUint = INCIDENT_TYPES[type] || DEFAULT_INCIDENT_TYPE;

      // 5. LLAMADA REAL AL CONTRATO: commit-incident
      const commitOptions = commitIncidentTx(
        evidenceHash,
        metaHash,
        geoHash,
        incidentTypeUint,
        senderAddress
      );

      await doContractCall({
        ...commitOptions,
        onFinish: (data) => {
          alert(`Commit enviado. TxID: ${data.txId}. Se agregará a la blockchain.`);

          // Lógica auxiliar para actualización local (no estado oficial)
          const id = `INC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
          addIncident({
            id,
            state: 'pending',
            title: metaData.type,
            location: metaData.location,
            plate: metaData.plate,
            timestamp: metaData.timestamp,
            evidenceHash,
          });
          window.location.href = '/feed';
        },
        onCancel: () => {
          alert('Transacción de commit cancelada.');
        },
      });
    } catch (error) {
      console.error('Error al iniciar el commit:', error);
      alert('Error al iniciar la transacción de commit. Vea la consola para detalles.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <NavBar active="/registrar" />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-extrabold text-green-400">Registrar Nuevo Incidente</h1>
        <p className="text-slate-400 mb-6">Sella tu evidencia en la blockchain de forma segura</p>

        <form
          onSubmit={onSubmit}
          className="bg-[#121a2b] border border-white/10 rounded-2xl p-6 grid gap-5"
        >
          {/* Evidencia */}
          <div className="grid gap-2">
            <label className="text-slate-300">Evidencia (foto o video)</label>
            <div className="h-40 border border-dashed border-white/20 rounded-xl grid place-items-center text-slate-400">
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>

          {/* Ubicación */}
          <div className="grid gap-2">
            <label className="text-slate-300">Ubicación (GPS)</label>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-[#0e1627] border border-white/10 rounded px-3 py-2"
                placeholder="Ej: -16.5000, -68.1500 o Av. Principal, La Paz"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <button
                type="button"
                onClick={useCurrentLocation}
                className="px-3 py-2 rounded bg-white/10 hover:bg-white/15"
              >
                Usar mi ubicación
              </button>
            </div>
          </div>

          {/* Tipo/Placa */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-slate-300">Tipo de incidente</label>
              <select
                className="bg-[#0e1627] border border-white/10 rounded px-3 py-2"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">Selecciona el tipo</option>
                <option>Colisión</option>
                <option>Exceso de velocidad</option>
                <option>Estacionamiento indebido</option>
                <option>Semáforo en rojo</option>
                <option>Invasión de carril</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-slate-300">Placa del vehículo</label>
              <input
                className="bg-[#0e1627] border border-white/10 rounded px-3 py-2"
                placeholder="ABC-1234"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
              />
            </div>
          </div>

          {/* Notas */}
          <div className="grid gap-2">
            <label className="text-slate-300">Notas adicionales (opcional)</label>
            <textarea
              className="bg-[#0e1627] border border-white/10 rounded px-3 py-2 h-28"
              placeholder="Describe lo ocurrido…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-4 text-blue-200 text-sm">
            Al sellar esta evidencia, se creará un hash de compromiso en la blockchain. Deberás
            revelar la evidencia completa posteriormente.
          </div>

          <button
            disabled={busy}
            className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 font-semibold disabled:opacity-60"
          >
            {busy ? 'Sellando…' : 'Sellar evidencia en blockchain'}
          </button>

          {hash && (
            <div className="text-xs text-slate-300 break-all">
              <b>evidenceHash:</b> {hash}
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
