import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { notionToken, foldersDbId, name } = req.body;

  if (!notionToken || !foldersDbId || !name) {
    return res.status(400).json({ error: 'notionToken, foldersDbId, name are required' });
  }

  const notion = new Client({ auth: notionToken });

  try {
    // 이미 존재하는지 확인
    const existing = await notion.databases.query({
      database_id: foldersDbId,
      filter: {
        property: 'sub',
        rich_text: { equals: name }
      }
    });

    if (existing.results.length > 0) {
      // 이미 존재하면 해당 id 반환
      return res.status(200).json({ 
        success: true, 
        exists: true,
        folderId: existing.results[0].id 
      });
    }

    // 새 폴더 생성
    const page = await notion.pages.create({
      parent: { database_id: foldersDbId },
      properties: {
        '이름': {
          title: [{ text: { content: name } }]
        },
        'sub': {
          rich_text: [{ text: { content: name } }]
        },
        'color': {
          rich_text: [{ text: { content: '#8B0000' } }]
        }
      }
    });

    res.status(200).json({ 
      success: true, 
      exists: false,
      folderId: page.id 
    });

  } catch (error) {
    console.error('Create Folder Error:', error);
    res.status(500).json({ error: 'Failed to create folder', message: error.message });
  }
}
