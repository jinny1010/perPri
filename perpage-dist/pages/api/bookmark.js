import { Client } from '@notionhq/client';
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const notionToken = req.headers['x-notion-token'];
  const bookmarksDbId = req.headers['x-db-bookmarks'];
  const blobToken = req.headers['x-blob-token'];
  
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

    // 이미지 URL 처리
    let finalImageUrl = null;
    
    if (imageUrl) {
      const isNotionUrl = 
        imageUrl.includes('notion') || 
        imageUrl.includes('secure.notion-static.com') ||
        imageUrl.includes('prod-files-secure.s3') ||
        imageUrl.includes('s3.us-west-2.amazonaws.com');
      
      if (isNotionUrl && blobToken) {
        // Notion URL이고 Blob 토큰이 있으면 재업로드
        try {
          const response = await fetch(imageUrl);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const fileName = `bookmark_${Date.now()}.jpg`;
            
            const blob = await put(fileName, buffer, {
              access: 'public',
              contentType: 'image/jpeg',
              token: blobToken,
            });
            
            finalImageUrl = blob.url;
          }
        } catch (err) {
          console.error('Failed to re-upload Notion image:', err);
        }
      } else if (!isNotionUrl) {
        // 외부 URL은 그대로 사용
        finalImageUrl = imageUrl;
      }
    }
    
    if (finalImageUrl) {
      properties['image'] = {
        files: [{
          name: 'bookmark_image',
          type: 'external',
          external: { url: finalImageUrl },
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
      imageUrl: finalImageUrl,
    });

  } catch (error) {
    console.error('Bookmark Error:', error);
    res.status(500).json({ 
      error: 'Failed to save bookmark',
      message: error.message 
    });
  }
}
