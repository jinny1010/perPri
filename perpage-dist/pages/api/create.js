import { Client } from '@notionhq/client';
import { put } from '@vercel/blob';
import formidable from 'formidable';
import fs from 'fs';

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
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const sub = Array.isArray(fields.sub) ? fields.sub[0] : fields.sub;
    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
    const notionToken = Array.isArray(fields.notionToken) ? fields.notionToken[0] : fields.notionToken;
    const postsDbId = Array.isArray(fields.postsDbId) ? fields.postsDbId[0] : fields.postsDbId;
    const blobToken = Array.isArray(fields.blobToken) ? fields.blobToken[0] : fields.blobToken;
    const file = files.file ? (Array.isArray(files.file) ? files.file[0] : files.file) : null;

    if (!sub || !title || !notionToken || !postsDbId) {
      return res.status(400).json({ error: 'sub, title, notionToken, postsDbId are required' });
    }

    const notion = new Client({ auth: notionToken });

    let fileUrl = null;
    let fileName = null;

    // 파일이 있고 Blob 토큰이 있으면 업로드
    if (file && blobToken) {
      try {
        const fileBuffer = fs.readFileSync(file.filepath);
        fileName = file.originalFilename || 'chat.jsonl';
        
        const blob = await put(`posts/${Date.now()}_${fileName}`, fileBuffer, {
          access: 'public',
          contentType: 'application/json',
          token: blobToken,
        });
        
        fileUrl = blob.url;
      } catch (blobErr) {
        console.error('Blob upload failed:', blobErr.message);
        // Blob 실패해도 계속 진행 (파일 없이)
      }
    }

    // 노션 페이지 생성
    const properties = {
      '이름': {
        title: [{ text: { content: title } }],
      },
      'sub': {
        rich_text: [{ text: { content: sub } }],
      },
    };

    // 파일이 있으면 jsonFile 속성 추가
    if (fileUrl) {
      properties['jsonFile'] = {
        files: [{
          name: fileName,
          type: 'external',
          external: { url: fileUrl },
        }],
      };
    }

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
      fileUrl,
      message: fileUrl ? '등록 완료!' : '등록 완료! 노션에서 jsonFile에 파일을 직접 업로드해주세요.'
    });

  } catch (error) {
    console.error('Create Error:', error);
    res.status(500).json({ 
      error: 'Failed to create post',
      message: error.message 
    });
  }
}
