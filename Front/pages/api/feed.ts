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

type BlockchainIncident = {
  id: string; // ID numérico del incidente
  state: IncidentState;
  evidenceHash: string;
  cid?: string;
  timestamp: string;
};

export default function FeedPage() {
  const [blockchainItems, setBlockchainItems] = useState<BlockchainIncident[]>([]);
  const [localItems, setLocalItems] = useState<Incident[]>(getLocalFeed());
  const [stateFilter, setStateFilter] = useState<string>('Todos los estados');

  // Cargar feed de la blockchain y sincronizar cambios locales
  useEffect(() => {
    (async () => {
      const items = await fetchFeed();
      setBlockchainItems(items.map(i => ({
        id: i.id, 
        state: i.state as IncidentState, 
        evidenceHash: i.evidenceHash, 
        cid: i.cid,
        timestamp: i.timestamp || new Date().toISOString(),
      })));
    })();
    const off = onFeedChange(() => setLocalItems(getLocalFeed()));
    return off;
  }, []);

  const items = useMemo(() => {
    // 1. Crear un mapa para buscar rápidamente los datos locales por ID.
    const localMap = localItems.reduce((acc, curr) => {
        // Usar solo el ID numérico del formato 'INC-XXXX-0001'
        const idNum = curr.id.split('-').pop()?.padStart(4, '0');
        if (idNum) acc[idNum] = curr;
        return acc;
    }, {} as Record<string, Incident>);
    
    // 2. Fusionar los datos de la blockchain con los detalles locales (title, location, plate)
    const merged: Incident[] = blockchainItems.map(bcItem => {
        const localDetails = localMap[bcItem.id];
        
        return {
            ...localDetails, 
            ...bcItem,
            
            id: localDetails?.id || `INC-????-${bcItem.id}`, 
            title: localDetails?.title || 'Incidente Desconocido',
            location: localDetails?.location || 'Ubicación Desconocida',
            plate: localDetails?.plate || 'Placa Desconocida',
        } as Incident;
    });

    // 3. Aplicar filtro de estado
    if (stateFilter === 'Todos los estados') return merged;
    const want = ES_TO_STATE[stateFilter];
    return merged.filter(i => i.state === want);
  }, [localItems, blockchainItems, stateFilter]);
