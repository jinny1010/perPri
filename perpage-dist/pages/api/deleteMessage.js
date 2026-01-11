import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 메시지 삭제는 파일 재업로드가 필요해서 현재 지원하지 않음
  // Notion에서 직접 수정하세요
  return res.status(400).json({ 
    error: '메시지 삭제는 현재 지원하지 않습니다. Notion에서 직접 파일을 수정해주세요.' 
  });
}
