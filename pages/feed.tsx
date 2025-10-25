import { useEffect, useMemo, useState } from 'react';
import NavBar from '../components/NavBar';
import { fetchFeed } from '../lib/api';
import { Incident, IncidentState, addIncident, getLocalFeed, onFeedChange } from '../lib/store';

const ES_TO_STATE: Record<string, IncidentState> = {
  'Pendiente': 'pending',
  'Disputado': 'disputed',
  'Revelado':  'revealed',
  'Resuelto':  'resolved',
  'Stale':     'stale',
};

function badgeClass(s: IncidentState) {
  return {
    pending:  'bg-yellow-500 text-black',
    revealed: 'bg-green-600 text-white',
    disputed: 'bg-red-600 text-white',
    resolved: 'bg-emerald-600 text-white',
    stale:    'bg-slate-500 text-white',
  }[s];
}

export default function FeedPage() {
  const [apiItems, setApiItems] = useState<Incident[]>([]);
  const [localItems, setLocalItems] = useState<Incident[]>(getLocalFeed());
  const [stateFilter, setStateFilter] = useState<string>('Todos los estados');

  // cargar mock API y sincronizar cambios locales
  useEffect(() => {
    (async () => {
      const raw = await fetchFeed();
      // adaptamos objetos del API mock a Incident minimal si hace falta
      const mapped: Incident[] = raw.map((r: any, idx: number) => ({
        id: r.id || `API-${idx}`,
        state: (r.state ?? 'pending') as IncidentState,
        title: r.title ?? 'Incidente',
        location: r.location ?? '—',
        plate: r.plate ?? '—',
        timestamp: r.timestamp ?? new Date().toISOString(),
        evidenceHash: r.evidenceHash,
        cid: r.cid,
      }));
      setApiItems(mapped);
    })();
    const off = onFeedChange(() => setLocalItems(getLocalFeed()));
    return off;
  }, []);

  const items = useMemo(() => {
    const merged = [...localItems, ...apiItems];
    if (stateFilter === 'Todos los estados') return merged;
    const want = ES_TO_STATE[stateFilter];
    return merged.filter(i => i.state === want);
  }, [localItems, apiItems, stateFilter]);

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <NavBar active="/feed" />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold">Feed de Incidentes</h1>
            <p className="text-slate-400">{items.length} incidentes</p>
          </div>
          <div className="flex gap-3">
            <select
              className="bg-[#121a2b] border border-white/10 rounded-lg px-3 py-2"
              value={stateFilter}
              onChange={(e)=>setStateFilter(e.target.value)}
            >
              <option>Todos los estados</option>
              <option>Pendiente</option>
              <option>Revelado</option>
              <option>Resuelto</option>
              <option>Disputado</option>
              <option>Stale</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(card => (
            <div key={card.id} className="bg-[#121a2b] border border-white/10 rounded-2xl p-5 shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">ID: {card.id}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${badgeClass(card.state)}`}>
                  {card.state.toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg font-semibold">{card.title}</h3>
              <div className="text-slate-400 text-sm mt-1">📍 {card.location}</div>
              <div className="text-slate-400 text-sm">📅 {new Date(card.timestamp).toISOString().slice(0,10)}</div>
              <div className="mt-3 text-sm"><b>Placa:</b> {card.plate}</div>
              <div className="mt-4 h-28 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 grid place-items-center text-slate-400">
                📍 Mapa placeholder
              </div>
            </div>
          ))}
        </div>
      </main>

      <a href="/registrar"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 text-white text-2xl grid place-items-center shadow-lg">
        +
      </a>
    </div>
  );
}
