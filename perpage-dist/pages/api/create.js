import { Client } from '@notionhq/client';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable();

    const [fields] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const sub = Array.isArray(fields.sub) ? fields.sub[0] : fields.sub;
    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
    const notionToken = Array.isArray(fields.notionToken) ? fields.notionToken[0] : fields.notionToken;
    const postsDbId = Array.isArray(fields.postsDbId) ? fields.postsDbId[0] : fields.postsDbId;

    if (!sub || !title || !notionToken || !postsDbId) {
      return res.status(400).json({ error: 'sub, title, notionToken, postsDbId are required' });
    }

    const notion = new Client({ auth: notionToken });

    // 노션 페이지 생성 (파일은 노션에서 직접 업로드)
    const properties = {
      '이름': {
        title: [{ text: { content: title } }],
      },
      'sub': {
        rich_text: [{ text: { content: sub } }],
      },
    };

    const page = await notion.pages.create({
      parent: {
        database_id: postsDbId,
      },
      properties,
    });

    const notionUrl = `https://notion.so/${page.id.replace(/-/g, '')}`;

    res.status(200).json({ 
      success: true, 
      pageId: page.id,
      notionUrl,
      message: '등록 완료! Notion에서 jsonFile에 파일을 직접 업로드해주세요.'
    });

  } catch (error) {
    console.error('Create Error:', error);
    res.status(500).json({ 
      error: 'Failed to create post',
      message: error.message 
    });
  }
}
