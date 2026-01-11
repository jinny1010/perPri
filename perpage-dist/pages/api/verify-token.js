import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { notionToken } = req.body;

  if (!notionToken) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    const notion = new Client({ auth: notionToken });
    await notion.users.me();
    res.status(200).json({ valid: true });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
}
