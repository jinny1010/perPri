# 📖 Perpage 배포 가이드

## 🎯 구조

```
사용자가 API 키 입력
    ↓
자동으로 접근 가능한 DB 탐색!
    ↓
Posts, Folders, Bookmarks, Themes, Gallery DB 자동 매칭

너의 배포 사이트
your-site.vercel.app
 │
 ├→ / (등록 페이지)
 │   └→ 닉네임 + Notion API 키 + 캐릭터 이름 입력
 │   └→ API 키로 DB 자동 탐색!
 │   └→ 브라우저당 1회만 등록 가능
 │
 └→ /u/암호화된ID (사용자 페이지)
     └→ 원래 /folder/[sub] 페이지와 동일한 기능
     └→ 사용자의 Notion API 키로 데이터 접근
     └→ 사이트/갤러리 비밀번호 설정 가능
```

---

## 🚀 배포 방법

### 1단계: Notion 준비 (사용자용)

사용자에게 안내할 내용:
1. Notion에 DB 5개 생성 (이름 중요!):
   - `Posts` 또는 `posts`
   - `Folders` 또는 `folders`  
   - `Bookmarks` 또는 `bookmarks`
   - `Themes` 또는 `themes`
   - `Gallery` 또는 `gallery`

2. 자신의 Integration 생성 (API 키 발급)
3. 모든 DB에 Integration 연결 (공유 → Integration 추가)

### 2단계: Vercel 배포

1. GitHub에 이 코드 업로드

2. Vercel에서 Import

3. 환경변수 설정:
```
BLOB_READ_WRITE_TOKEN=vercel_blob_token
KILLSWITCH=false
```

4. Deploy!

### 3단계: 사용자 등록

사용자가 너의 사이트에서:
1. 닉네임 입력
2. Notion API 키 입력 → **DB 자동 탐색!**
3. 캐릭터 이름 입력
4. 생성된 URL 저장!

---

## 🔍 DB 자동 탐색

API 키로 접근 가능한 DB들을 자동으로 찾아서 매칭해:

| DB 이름 | 매칭되는 이름들 |
|---------|----------------|
| Posts | posts, post, 포스트, 게시물 |
| Folders | folders, folder, 폴더 |
| Bookmarks | bookmarks, bookmark, 책갈피, 북마크 |
| Themes | themes, theme, 테마 |
| Gallery | gallery, 갤러리, images, image |

→ **DB 이름만 맞추면 DB ID 입력 필요 없음!**

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

## 📱 다른 기기 접속

사용자가 다른 기기에서 URL 접속 시:
1. API 키 입력 → DB 자동 탐색
2. 캐릭터 이름 입력
3. 끝!
