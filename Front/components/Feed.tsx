import { useEffect, useState } from 'react';
import { fetchFeed } from '../lib/api';

type Item = {
  id: string;
  state: 'pending'|'revealed'|'disputed'|'stale';
  evidenceHash: string;
  cid?: string;
  timestamp?: string;
};

export default function Feed() {
  const [items, setItems] = useState<Item[]>([]);
  const [stateFilter, setStateFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setItems(await fetchFeed());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = stateFilter === 'all' ? items : items.filter(i => i.state === stateFilter);

  if (loading) return <p>Cargando feed…</p>;

  return (
    <div className="grid gap-3">
      <div>
        <select className="border rounded px-2 py-1" value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
          <option value="all">Todos</option>
          <option value="pending">Pending</option>
          <option value="revealed">Revealed</option>
          <option value="disputed">Disputed</option>
          <option value="stale">Stale</option>
        </select>
      </div>

      {filtered.map(item => (
        <div key={item.id} className="border rounded p-3">
          <div className="flex justify-between">
            <strong>#{item.id}</strong>
            <span className="text-xs uppercase">{item.state}</span>
          </div>
          <div className="text-xs break-all"><b>hash:</b> {item.evidenceHash}</div>
          {item.cid && <div className="text-xs break-all"><b>cid:</b> {item.cid}</div>}
          {item.timestamp && <div className="text-xs">{new Date(item.timestamp).toLocaleString()}</div>}
        </div>
      ))}
    </div>
  );
}
