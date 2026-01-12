import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 헤더에서 Notion 토큰과 DB ID 가져오기
  const notionToken = req.headers['x-notion-token'];
  const foldersDbId = req.headers['x-db-folders'];
  const postsDbId = req.headers['x-db-posts'];
  
  if (!notionToken) {
    return res.status(401).json({ error: 'Notion token required' });
  }
  if (!foldersDbId || !postsDbId) {
    return res.status(400).json({ error: 'DB IDs required' });
  }

  const notion = new Client({ auth: notionToken });

  try {
    const foldersResponse = await notion.databases.query({
      database_id: foldersDbId,
    });

    const folderMap = {};
    for (const page of foldersResponse.results) {
      const props = page.properties;
      
      const nameProperty = props['이름'];
      const name = nameProperty?.title?.[0]?.plain_text || '';
      
      const subProperty = props['sub'];
      const sub = subProperty?.rich_text?.[0]?.plain_text || name;
      
      const imageProperty = props['파일과 미디어'];
      const allImages = imageProperty?.files?.map(f => f.file?.url || f.external?.url).filter(Boolean) || [];
      const imageUrl = allImages[0] || null;
      const menuImages = allImages.slice(1);

      const colorProperty = props['color'];
      const color = colorProperty?.rich_text?.[0]?.plain_text || '#8B0000';

      const youtubeProperty = props['youtubeUrl'];
      const youtubeUrl = youtubeProperty?.url || null;

      if (sub) {
        folderMap[sub] = {
          id: page.id,
          name: sub,
          imageUrl,
          menuImages,
          color,
          youtubeUrl,
          count: 0,
        };
      }
    }

    const postsResponse = await notion.databases.query({
      database_id: postsDbId,
    });

    for (const page of postsResponse.results) {
      const props = page.properties;
      const subProperty = props['sub'];
      const sub = subProperty?.rich_text?.[0]?.plain_text || '미분류';
      
      const fileProperty = props['jsonFile'];
      const hasFile = fileProperty?.files?.length > 0;
      
      if (hasFile) {
        if (folderMap[sub]) {
          folderMap[sub].count++;
        } else {
          folderMap[sub] = {
            id: null, // 폴더 DB에 없는 경우 id 없음
            name: sub,
            imageUrl: null,
            menuImages: [],
            color: '#8B0000',
            youtubeUrl: null,
            count: 1,
          };
        }
      }
    }

    const folders = Object.values(folderMap)
      .filter(f => f.count > 0 || f.imageUrl)
      .sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json({ folders });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({ error: 'Failed to fetch folders', message: error.message });
  }
}
