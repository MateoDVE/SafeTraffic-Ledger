// lib/api.ts

import { getIncidentCounter, getIncidentData } from './stacks';

type Item = {
  id: string;
  state: 'pending' | 'revealed' | 'disputed' | 'stale';
  evidenceHash: string;
  cid?: string;
  timestamp?: string;
};

/**
 * Usa backend real si hay NEXT_PUBLIC_API_BASE.
 * Si NO hay backend, usa el endpoint local /api/feed (mock).
 */
export async function fetchFeed(): Promise<Item[]> {
  // Ignoramos NEXT_PUBLIC_API_BASE y forzamos la lectura de la blockchain para "Feed real".

  const totalIncidents = await getIncidentCounter();
  const incidentPromises = [];

  for (let id = 1; id <= totalIncidents; id++) {
    incidentPromises.push(getIncidentData(id));
  }

  const incidents = await Promise.all(incidentPromises);

  // Mapear el resultado Clarity a la estructura Item del frontend
  const feedItems: Item[] = incidents
    .filter(
      (data): data is NonNullable<Awaited<ReturnType<typeof getIncidentData>>> => data !== null
    )
    .map((data) => {
      // Mapeo de status uint a string de estado
      const statusMap: Record<number, Item['state']> = {
        0: 'pending',
        1: 'revealed',
        2: 'disputed',
        3: 'resolved',
        4: 'stale',
      };

      return {
        id: data.id,
        state: statusMap[data.status] || 'pending',
        evidenceHash: data.evidenceHash,
        cid: data.reveralCid.startsWith('bafy') ? data.reveralCid : undefined,
        // Usar la fecha actual o el commit-height como proxy para la fecha si no está en el contrato
        timestamp: new Date().toISOString(),
      };
    });

  return feedItems;
}
