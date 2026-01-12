import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  console.log('=== updateFolder API ===');
  console.log('method:', req.method);
  console.log('headers x-notion-token:', req.headers['x-notion-token'] ? 'exists' : 'missing');
  console.log('body:', req.body);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const notionToken = req.headers['x-notion-token'];
  if (!notionToken) {
    console.log('ERROR: Token missing');
    return res.status(400).json({ error: 'Token required' });
  }
  
  const notion = new Client({ auth: notionToken });

  try {
    const { folderId, name, color, imageUrl } = req.body;
    console.log('Parsed:', { folderId, name, color, imageUrl });

    if (!folderId) {
      console.log('ERROR: folderId missing');
      return res.status(400).json({ error: 'folderId is required' });
    }

    const properties = {};

    // 이름 수정 (표시 이름만, sub는 변경 안함)
    if (name) {
      properties['이름'] = {
        title: [{ text: { content: name } }],
      };
    }

    // 색상 수정
    if (color) {
      properties['color'] = {
        rich_text: [{ text: { content: color } }],
      };
    }

    // 이미지 수정 (외부 URL)
    if (imageUrl) {
      properties['파일과 미디어'] = {
        files: [{
          name: 'folder_image',
          type: 'external',
          external: { url: imageUrl },
        }],
      };
    }

    console.log('properties to update:', JSON.stringify(properties));

    if (Object.keys(properties).length === 0) {
      console.log('ERROR: Nothing to update');
      return res.status(400).json({ error: 'Nothing to update' });
    }

    console.log('Calling notion.pages.update with page_id:', folderId);
    await notion.pages.update({
      page_id: folderId,
      properties,
    });

    console.log('SUCCESS');
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Notion API Error:', error.message, error.code);
    res.status(500).json({ error: 'Failed to update folder', message: error.message });
  }
}
