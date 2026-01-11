import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { notionToken } = req.body;

  if (!notionToken) {
    return res.status(400).json({ message: 'API 키를 입력해주세요' });
  }

  try {
    const notion = new Client({ auth: notionToken });
    
    // API 키로 접근 가능한 모든 DB 검색
    const response = await notion.search({
      filter: { property: 'object', value: 'database' }
    });

    if (response.results.length === 0) {
      return res.status(400).json({ 
        message: 'DB를 찾을 수 없습니다. Integration에 DB 접근 권한이 있는지 확인하세요.' 
      });
    }

    // DB 이름으로 매칭 (대소문자 무시)
    const dbIds = {
      posts: null,
      folders: null,
      bookmarks: null,
      themes: null,
      gallery: null,
    };

    const nameMapping = {
      'posts': 'posts',
      'post': 'posts',
      '포스트': 'posts',
      '게시물': 'posts',
      'folders': 'folders',
      'folder': 'folders',
      '폴더': 'folders',
      'bookmarks': 'bookmarks',
      'bookmark': 'bookmarks',
      '책갈피': 'bookmarks',
      '북마크': 'bookmarks',
      'themes': 'themes',
      'theme': 'themes',
      '테마': 'themes',
      'gallery': 'gallery',
      '갤러리': 'gallery',
      'images': 'gallery',
      'image': 'gallery',
    };

    for (const db of response.results) {
      const title = db.title?.[0]?.plain_text?.toLowerCase() || '';
      
      // 정확히 매칭
      if (nameMapping[title]) {
        dbIds[nameMapping[title]] = db.id;
        continue;
      }
      
      // 포함 매칭
      for (const [keyword, key] of Object.entries(nameMapping)) {
        if (title.includes(keyword) && !dbIds[key]) {
          dbIds[key] = db.id;
          break;
        }
      }
    }

    // 필수 DB 체크
    const missing = [];
    if (!dbIds.posts) missing.push('Posts');
    if (!dbIds.folders) missing.push('Folders');
    
    if (missing.length > 0) {
      return res.status(400).json({ 
        message: `다음 DB를 찾을 수 없습니다: ${missing.join(', ')}. DB 이름을 확인해주세요.`,
        found: Object.entries(dbIds).filter(([k, v]) => v).map(([k]) => k),
        allDbs: response.results.map(db => ({
          id: db.id,
          title: db.title?.[0]?.plain_text || '(제목 없음)'
        }))
      });
    }

    res.status(200).json({ 
      success: true, 
      dbIds,
      message: '모든 DB를 찾았습니다!'
    });

  } catch (error) {
    console.error('Detect DBs Error:', error);
    
    if (error.code === 'unauthorized') {
      return res.status(401).json({ message: 'API 키가 유효하지 않습니다' });
    }
    
    res.status(500).json({ 
      message: 'DB 탐색 중 오류가 발생했습니다: ' + error.message 
    });
  }
}
