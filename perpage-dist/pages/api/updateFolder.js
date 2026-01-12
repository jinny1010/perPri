import { Client } from '@notionhq/client';
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const notionToken = req.headers['x-notion-token'];
  const blobToken = req.headers['x-blob-token'];
  
  if (!notionToken) {
    return res.status(400).json({ error: 'Token required' });
  }
  
  const notion = new Client({ auth: notionToken });

  try {
    const { folderId, name, color, imageUrl } = req.body;

    if (!folderId) {
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

    // 이미지 수정
    if (imageUrl) {
      const isNotionUrl = 
        imageUrl.includes('notion') || 
        imageUrl.includes('secure.notion-static.com') ||
        imageUrl.includes('prod-files-secure.s3') ||
        imageUrl.includes('s3.us-west-2.amazonaws.com');
      
      let finalImageUrl = null;
      
      if (isNotionUrl && blobToken) {
        // Notion URL이고 Blob 토큰이 있으면 재업로드
        try {
          const response = await fetch(imageUrl);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const fileName = `folder_${Date.now()}.jpg`;
            
            const blob = await put(fileName, buffer, {
              access: 'public',
              contentType: 'image/jpeg',
              token: blobToken,
            });
            
            finalImageUrl = blob.url;
          }
        } catch (err) {
          console.error('Failed to re-upload Notion image:', err);
          return res.status(400).json({ error: 'Notion 이미지 재업로드 실패. Blob 토큰을 확인하세요.' });
        }
      } else if (isNotionUrl && !blobToken) {
        return res.status(400).json({ error: 'Notion 이미지 사용 불가. 설정에서 Blob 토큰을 등록하거나 외부 URL을 사용하세요.' });
      } else {
        // 외부 URL은 그대로 사용
        finalImageUrl = imageUrl;
      }
      
      if (finalImageUrl) {
        properties['파일과 미디어'] = {
          files: [{
            name: 'folder_image',
            type: 'external',
            external: { url: finalImageUrl },
          }],
        };
      }
    }

    if (Object.keys(properties).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    await notion.pages.update({
      page_id: folderId,
      properties,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Notion API Error:', error.message);
    res.status(500).json({ error: 'Failed to update folder', message: error.message });
  }
}
