import type { NextApiRequest, NextApiResponse } from 'next';

type Item = {
  id: string;
  state: 'pending' | 'revealed' | 'disputed' | 'stale';
  evidenceHash: string;
  cid?: string;
  timestamp?: string;
};

// 👇 Esto es lo importante: export default function handler
export default function handler(req: NextApiRequest, res: NextApiResponse<Item[]>) {
  const data: Item[] = [
    { id: '1001', state: 'pending',  evidenceHash: '0xabc123...pending',  timestamp: new Date().toISOString() },
    { id: '1000', state: 'revealed', evidenceHash: '0xdef456...revealed', cid: 'bafybeigd...', timestamp: new Date(Date.now()-3600_000).toISOString() },
    { id: '0999', state: 'disputed', evidenceHash: '0x999aaa...disputed', timestamp: new Date(Date.now()-2*3600_000).toISOString() },
  ];

  res.status(200).json(data);
}
