import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sub } = req.query;

  const notionToken = req.headers['x-notion-token'];
  const galleryDbId = req.headers['x-db-gallery'];
  
  if (!notionToken) {
    return res.status(400).json({ error: 'Token required' });
  }
  
  // gallery DB가 없으면 빈 배열 반환
  if (!galleryDbId) {
    return res.status(200).json({ gallery: [] });
  }
  
  const notion = new Client({ auth: notionToken });

  try {
    console.log('Gallery API - querying DB:', galleryDbId);
    
    // 필터 없이 전체 조회
    const response = await notion.databases.query({
      database_id: galleryDbId,
    });

    console.log('Gallery API - results count:', response.results.length);

    const gallery = [];
    
    response.results.forEach(page => {
      const props = page.properties;
      console.log('Gallery page props:', JSON.stringify(props, null, 2));
      
      // 속성 이름이 한글/영어 둘 다 지원
      const name = props['이름']?.title?.[0]?.plain_text || 
                   props['name']?.title?.[0]?.plain_text || 
                   props['name']?.rich_text?.[0]?.plain_text || '';
      const subValue = props['sub']?.rich_text?.[0]?.plain_text || 
                       props['sub']?.select?.name || '';
      const favorite = props['즐겨찾기']?.checkbox || 
                       props['favorite']?.checkbox || false;
      const isPrivate = props['private']?.checkbox || false;
      
      // 파일 속성도 여러 이름 지원
      const files = props['파일과 미디어']?.files || 
                    props['image']?.files || 
                    props['파일']?.files || [];
      
      console.log('Parsed gallery item:', { name, subValue, filesCount: files.length, isPrivate });
      
      // 한 행의 모든 파일 처리
      files.forEach((file, index) => {
        let fileUrl = file?.file?.url || file?.external?.url || null;
        const fileName = file?.name || '';
        const isZip = fileName.toLowerCase().endsWith('.zip');

        // Google Drive URL 변환
        if (fileUrl && fileUrl.includes('drive.google.com/file/d/')) {
          const match = fileUrl.match(/\/d\/([^\/]+)/);
          if (match) {
            fileUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
          }
        }

        gallery.push({
          id: `${page.id}_${index}`,
          name: name || fileName,
          sub: subValue,
          favorite,
          isPrivate,
          fileUrl,
          fileName,
          isZip
        });
      });
    });

    res.status(200).json({ gallery });
  } catch (error) {
    console.error('Gallery API Error:', error);
    res.status(500).json({ error: 'Failed to fetch gallery', message: error.message });
  }
}
