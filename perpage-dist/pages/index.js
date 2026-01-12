import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// 암호화 함수
const encryptNickname = (nickname) => {
  const str = nickname + '_' + Date.now().toString(36);
  const base64 = Buffer.from(str).toString('base64');
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .split('')
    .reverse()
    .join('');
};

export default function Home() {
  const router = useRouter();
  
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [myPageUrl, setMyPageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [killed, setKilled] = useState(false);
  
  const [nickname, setNickname] = useState('');
  const [notionToken, setNotionToken] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [registering, setRegistering] = useState(false);
  
  const [registered, setRegistered] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  useEffect(() => {
    const init = async () => {
      // 킬스위치 체크
      try {
        const res = await fetch('/api/killswitch');
        const data = await res.json();
        if (data.killed) {
          setKilled(true);
          setLoading(false);
          return;
        }
      } catch (err) {}
      
      // 이미 등록했는지 체크
      const myData = localStorage.getItem('myPerpage');
      if (myData) {
        const parsed = JSON.parse(myData);
        setAlreadyRegistered(true);
        setMyPageUrl(`/u/${parsed.encryptedId}`);
      }
      
      setLoading(false);
    };
    
    init();
  }, []);

  const handleRegister = async () => {
    if (!nickname.trim()) return alert('닉네임을 입력해주세요');
    if (!notionToken.trim()) return alert('Notion API 키를 입력해주세요');
    if (!characterName.trim()) return alert('캐릭터 이름을 입력해주세요');
    
    setRegistering(true);
    
    try {
      // API 키로 DB 자동 탐색
      const detectRes = await fetch('/api/detect-dbs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notionToken }),
      });
      
      const detectData = await detectRes.json();
      
      if (!detectRes.ok) {
        throw new Error(detectData.message || 'DB 탐색 실패');
      }
      
      // Folders DB에 캐릭터 폴더 생성
      const createFolderRes = await fetch('/api/createFolder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          notionToken,
          foldersDbId: detectData.dbIds.folders,
          name: characterName,
        }),
      });
      
      if (!createFolderRes.ok) {
        const err = await createFolderRes.json();
        console.error('폴더 생성 실패:', err);
        // 폴더 생성 실패해도 계속 진행 (이미 있을 수 있음)
      }
      
      // 암호화된 ID 생성
      const encryptedId = encryptNickname(nickname);
      
      // localStorage에 저장 (DB ID들 포함)
      const myData = {
        nickname,
        encryptedId,
        characterName,
        notionToken,
        dbIds: detectData.dbIds,
        registeredAt: new Date().toISOString(),
      };
      localStorage.setItem('myPerpage', JSON.stringify(myData));
      
      // 완료
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const link = `${baseUrl}/u/${encryptedId}`;
      setGeneratedLink(link);
      setRegistered(true);
      
    } catch (err) {
      alert(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('복사되었습니다!');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <style jsx>{`
          .loading-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #111; }
          .spinner { width: 40px; height: 40px; border: 3px solid #333; border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (killed) {
    return (
      <>
        <Head><title>서비스 종료</title></Head>
        <div className="kill-screen">
          <h1>🚫</h1>
          <h2>서비스 종료</h2>
          <p>이 사이트는 더 이상 이용할 수 없습니다.</p>
        </div>
        <style jsx>{`
          .kill-screen { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%); color: white; text-align: center; }
          h1 { font-size: 80px; margin-bottom: 20px; }
          h2 { font-size: 28px; margin-bottom: 10px; }
          p { color: #666; }
        `}</style>
      </>
    );
  }

  if (alreadyRegistered) {
    return (
      <>
        <Head><title>이미 등록됨</title></Head>
        <div className="already-screen">
          <div className="box">
            <h1>✅</h1>
            <h2>이미 등록되어 있습니다</h2>
            <p>브라우저당 하나만 등록 가능합니다.</p>
            <button onClick={() => router.push(myPageUrl)}>내 페이지로 이동 →</button>
          </div>
        </div>
        <style jsx>{`
          .already-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; }
          .box { background: white; border-radius: 24px; padding: 50px 40px; text-align: center; max-width: 400px; width: 100%; }
          h1 { font-size: 64px; margin-bottom: 15px; }
          h2 { font-size: 22px; margin-bottom: 10px; color: #333; }
          p { color: #666; margin-bottom: 25px; font-size: 14px; }
          button { padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; }
        `}</style>
      </>
    );
  }

  if (registered) {
    return (
      <>
        <Head><title>등록 완료!</title></Head>
        <div className="success-screen">
          <div className="box">
            <h1>🎉</h1>
            <h2>등록 완료!</h2>
            <p>아래 링크로 접속하세요</p>
            <div className="link-box">
              <input type="text" value={generatedLink} readOnly />
              <button onClick={() => copyToClipboard(generatedLink)}>복사</button>
            </div>
            <button className="go-btn" onClick={() => router.push(generatedLink)}>내 페이지로 이동 →</button>
            <p className="warning">⚠️ 이 링크를 잃어버리면 다시 찾을 수 없습니다!</p>
          </div>
        </div>
        <style jsx>{`
          .success-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 20px; }
          .box { background: white; border-radius: 24px; padding: 50px 40px; text-align: center; max-width: 500px; width: 100%; }
          h1 { font-size: 64px; margin-bottom: 15px; }
          h2 { font-size: 24px; margin-bottom: 10px; color: #333; }
          .box > p { color: #666; margin-bottom: 20px; font-size: 14px; }
          .link-box { display: flex; gap: 10px; margin-bottom: 20px; }
          .link-box input { flex: 1; padding: 14px; border: 2px solid #eee; border-radius: 10px; font-size: 13px; background: #f9f9f9; }
          .link-box button { padding: 14px 20px; background: #333; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; }
          .go-btn { width: 100%; padding: 16px; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; margin-bottom: 15px; }
          .warning { color: #e74c3c; font-size: 13px; margin: 0; }
        `}</style>
      </>
    );
  }

  return (
    <>
      <Head><title>페이지 등록</title></Head>
      <div className="register-screen">
        <div className="box">
          <h1>📝</h1>
          <h2>내 페이지 만들기</h2>
          <p>정보를 입력하고 나만의 페이지를 만드세요</p>
          
          <div className="form-group">
            <label>닉네임</label>
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="사용할 닉네임" />
            <small>URL에는 암호화되어 표시됩니다</small>
          </div>
          
          <div className="form-group">
            <label>캐릭터 이름</label>
            <input type="text" value={characterName} onChange={(e) => setCharacterName(e.target.value)} placeholder="예: Killian Vane" />
            <small>Notion 폴더의 sub 값과 동일하게</small>
          </div>
          
          <div className="form-group">
            <label>Notion API 키</label>
            <input type="password" value={notionToken} onChange={(e) => setNotionToken(e.target.value)} placeholder="secret_xxxxx..." />
            <small><a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer">Notion에서 API 키 발급받기 →</a></small>
          </div>
          
          <button className="register-btn" onClick={handleRegister} disabled={registering}>
            {registering ? '등록 중...' : '등록하기'}
          </button>
          
          <p className="notice">⚠️ 한 브라우저당 하나의 페이지만 등록 가능합니다</p>
        </div>
      </div>
      
      <style jsx>{`
        .register-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 20px; }
        .box { background: white; border-radius: 24px; padding: 50px 40px; max-width: 440px; width: 100%; }
        h1 { font-size: 48px; text-align: center; margin-bottom: 10px; }
        h2 { font-size: 24px; text-align: center; margin-bottom: 8px; color: #333; }
        .box > p { text-align: center; color: #666; margin-bottom: 30px; font-size: 14px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #333; }
        .form-group input { width: 100%; padding: 14px; border: 2px solid #eee; border-radius: 10px; font-size: 15px; }
        .form-group input:focus { outline: none; border-color: #1a1a2e; }
        .form-group small { display: block; margin-top: 6px; font-size: 12px; color: #888; }
        .form-group small a { color: #667eea; text-decoration: none; }
        .register-btn { width: 100%; padding: 16px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; margin-bottom: 15px; }
        .register-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .notice { text-align: center; font-size: 13px; color: #e67e22; margin: 0; }
      `}</style>
    </>
  );
}
