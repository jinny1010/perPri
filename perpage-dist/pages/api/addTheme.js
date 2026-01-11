import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const notionToken = req.headers['x-notion-token'];
  const themesDbId = req.headers['x-db-themes'];
  
  if (!notionToken || !themesDbId) {
    return res.status(400).json({ error: 'Token and themes DB ID required' });
  }

  const notion = new Client({ auth: notionToken });

  try {
    const { name, sub, cssUrl } = req.body;

    if (!name || !sub) {
      return res.status(400).json({ error: 'Name and sub are required' });
    }

    // Notion에 저장
    const properties = {
      '이름': {
        title: [{ text: { content: name } }]
      },
      'sub': {
        rich_text: [{ text: { content: sub } }]
      }
    };

    if (cssUrl) {
      properties['파일과 미디어'] = {
        files: [{
          type: 'external',
          name: `${name}.css`,
          external: { url: cssUrl }
        }]
      };
    }

    const page = await notion.pages.create({
      parent: { database_id: themesDbId },
      properties
    });

    res.status(200).json({ 
      success: true, 
      theme: {
        id: page.id,
        name,
        sub,
        cssUrl
      }
    });
  } catch (error) {
    console.error('Add Theme Error:', error);
    res.status(500).json({ error: 'Failed to add theme', message: error.message });
  }
}
