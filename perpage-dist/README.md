# 📖 Perpage 배포 가이드

## 🎯 구조

```
너의 Notion DB (원본)
    ↓ 사본 만들기로 공유
사용자 A의 Notion (사본) → DB ID 동일!
사용자 B의 Notion (사본) → DB ID 동일!

너의 배포 사이트
your-site.vercel.app
 │
 ├→ / (등록 페이지)
 │   └→ 닉네임 + Notion API 키 + 캐릭터 이름 입력
 │   └→ 브라우저당 1회만 등록 가능
 │
 └→ /u/암호화된ID (사용자 페이지)
     └→ 원래 /folder/[sub] 페이지와 동일한 기능
     └→ 사용자의 Notion API 키로 데이터 접근
     └→ 사이트/갤러리 비밀번호 설정 가능
```

---

## 🚀 배포 방법

### 1단계: Notion 준비

1. 너의 Notion에 DB 5개 생성 (또는 기존 것 사용)
   - Posts DB
   - Folders DB
   - Bookmarks DB
   - Themes DB
   - Gallery DB

2. 각 DB에서 "공유" → 사용자에게 "사본 만들기" 권한 부여

3. 사용자에게 너의 Notion 페이지 공유 → **사본 만들기**로 복제하라고 안내

### 2단계: Vercel 배포

1. GitHub에 이 코드 업로드

2. Vercel에서 Import

3. 환경변수 설정:
```
NOTION_DATABASE_ID=너의_posts_db_id
NOTION_FOLDERS_DB_ID=너의_folders_db_id
NOTION_BOOKMARKS_DB_ID=너의_bookmarks_db_id
NOTION_THEMES_DB_ID=너의_themes_db_id
NOTION_GALLERY_DB_ID=너의_gallery_db_id
BLOB_READ_WRITE_TOKEN=vercel_blob_token
KILLSWITCH=false
```

4. Deploy!

### 3단계: 사용자 안내

사용자에게 안내할 내용:
1. 너의 Notion 페이지에서 "사본 만들기"로 복제
2. 자신의 Notion에서 Integration 생성 (API 키 발급)
3. 복제한 DB들을 Integration에 연결
4. 너의 사이트에서 등록:
   - 닉네임
   - Notion API 키
   - 캐릭터 이름 (Folders DB의 sub 값과 동일하게)
5. 생성된 URL 저장!

---

## 🔒 비밀번호 시스템

### 사이트 비밀번호
- 기본값: `0000`
- 설정(⚙️)에서 ON/OFF 및 변경 가능
- localStorage에 저장

### 갤러리 비밀번호
- 기본값: `0406`
- 설정에서 변경 가능
- Private 갤러리 접근용

---

## 💀 킬스위치

Vercel 환경변수에서:
```
KILLSWITCH=true
```
→ Redeploy하면 모든 페이지 "서비스 종료"

---

## 🛡️ 프라이버시

- **Notion API 키**: 사용자 브라우저 localStorage에만 저장
- **너는 API 키 안 보임**
- 각 사용자는 **자기 Notion 사본**에 데이터 저장
- DB ID는 같지만, **API 키가 다르므로 서로 데이터 안 보임**

---

## 📱 다른 기기 접속

사용자가 다른 기기에서 URL 접속 시:
1. API 키 재입력 필요
2. 캐릭터 이름 재입력 필요
3. 원래 등록할 때 쓴 Notion API 키 입력하면 됨
