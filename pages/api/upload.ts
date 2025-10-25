import type { NextApiRequest, NextApiResponse } from 'next';

// Demo: devolvemos un CID falso distinto cada vez
export default async function handler(req: NextApiRequest, res: NextApiResponse<{cid:string}>) {
  await new Promise(r => setTimeout(r, 500));
  const cid = 'bafy' + Math.random().toString(36).slice(2, 10) + 'demo';
  res.status(200).json({ cid });
}
