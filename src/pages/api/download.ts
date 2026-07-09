import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url, filename, token } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const headers: any = {};
    if (token && typeof token === 'string') {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      headers: headers,
    });

    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    const safeFilename = typeof filename === 'string' ? filename.replace(/[^a-zA-Z0-9.\-_ ]/g, '_') : 'download';
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    
    // Send the arraybuffer response directly
    res.send(response.data);
  } catch (error: any) {
    console.error('Download proxy error:', error.message);
    res.status(500).json({ error: 'Failed to download file' });
  }
}
