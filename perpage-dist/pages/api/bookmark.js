import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const notionToken = req.headers['x-notion-token'];
  const bookmarksDbId = req.headers['x-db-bookmarks'];
  
  if (!notionToken) {
    return res.status(400).json({ error: 'Token required' });
  }
  if (!bookmarksDbId) {
    return res.status(400).json({ error: 'Bookmarks DB ID required' });
  }

  const notion = new Client({ auth: notionToken });

  try {
    const { text, sourceTitle, sub, imageUrl } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    // 노션 책갈피 DB에 저장
    const properties = {
      '이름': {
        title: [{ text: { content: text.substring(0, 50) + (text.length > 50 ? '...' : '') } }],
      },
      'text': {
        rich_text: [{ text: { content: text } }],
      },
      'sourceTitle': {
        rich_text: [{ text: { content: sourceTitle || '' } }],
      },
      'sub': {
        rich_text: [{ text: { content: sub || '' } }],
      },
    };

    // 이미지 URL이 있으면 추가 (외부 URL만 가능)
    if (imageUrl && !imageUrl.includes('notion') && !imageUrl.includes('secure.notion-static.com')) {
      properties['image'] = {
        files: [{
          name: 'bookmark_image',
          type: 'external',
          external: { url: imageUrl },
        }],
      };
    }

    const page = await notion.pages.create({
      parent: {
        database_id: bookmarksDbId,
      },
      properties,
    });

    res.status(200).json({ 
      success: true, 
      pageId: page.id,
      imageUrl,
    });

  } catch (error) {
    console.error('Bookmark Error:', error);
    res.status(500).json({ 
      error: 'Failed to save bookmark',
      message: error.message 
    });
  }
}
