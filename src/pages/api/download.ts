import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url, filename } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
    });

    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    const safeFilename = typeof filename === 'string' ? filename.replace(/[^a-zA-Z0-9.\-_ ]/g, '_') : 'download';
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    
    // Pipe the stream to the response
    response.data.pipe(res);
  } catch (error: any) {
    console.error('Download proxy error:', error.message);
    res.status(500).json({ error: 'Failed to download file' });
  }
}
