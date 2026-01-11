import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sub } = req.query;

  const notionToken = req.headers['x-notion-token'];
  const bookmarksDbId = req.headers['x-db-bookmarks'];
  
  if (!notionToken) {
    return res.status(400).json({ error: 'Token required' });
  }
  
  // bookmarks DB가 없으면 빈 배열 반환
  if (!bookmarksDbId) {
    return res.status(200).json({ bookmarks: [] });
  }
  
  const notion = new Client({ auth: notionToken });

  try {
    const response = await notion.databases.query({
      database_id: bookmarksDbId,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    });

    const bookmarks = response.results.map(page => {
      const props = page.properties;
      
      const textProp = props['text'];
      const text = textProp?.rich_text?.[0]?.plain_text || '';
      
      const sourceProp = props['sourceTitle'];
      const sourceTitle = sourceProp?.rich_text?.[0]?.plain_text || '';
      
      const subProp = props['sub'];
      const bookmarkSub = subProp?.rich_text?.[0]?.plain_text || '';
      
      const imageProp = props['image'];
      const imageUrl = imageProp?.files?.[0]?.file?.url || imageProp?.files?.[0]?.external?.url || null;

      return {
        id: page.id,
        text,
        sourceTitle,
        sub: bookmarkSub,
        imageUrl,
        createdAt: page.created_time,
      };
    }).filter(b => !sub || b.sub === sub);

    res.status(200).json({ bookmarks });
  } catch (error) {
    console.error('Bookmarks Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bookmarks',
      message: error.message 
    });
  }
}
