# ENGINEERING - link-pilot

## 시스템 구성
- `extension/`: Chrome Extension (저장 트리거 + 목록 UI)
- `server/`: Node.js HTTP API
- `server/bookmark.db`: SQLite 저장소

## 서버 기본
- Host: `127.0.0.1`
- Port: `4312`
- Health: `GET /health`

## API
- `POST /bookmarks` — 북마크 저장
- `GET /bookmarks?status=&q=&tag=&sort=` — 목록 조회/필터
- `PATCH /bookmarks/:id` — 상태/태그/메모 업데이트
- `POST /bookmarks/:id/summarize` — 요약 생성 (실패 시 fallback)
- `GET /bookmarks/:id/summary` — 요약 조회
- `GET /bookmarks/:id/summary-run` — 최근 요약 실행 정보
- `POST /bookmarks/import` — JSON Import
- `POST /bookmarks/bulk-status` — 전체 상태 일괄 변경
- `GET /stats` — 기본 통계

## 데이터 모델 (개요)
### Bookmark
- id
- url
- title
- status (`unread` | `read`)
- tags
- memo
- created_at / updated_at

### Summary
- bookmark_id
- short_summary
- key_points[]
- generated_at
- run metadata(success/error)

## 에러 처리
- invalid payload: `400`
- not found: `404`
- 요약 실패: fallback 요약 반환 + run 로그 저장

## 개발 루프 (Ralph-style)
- L0 (30~60m): 문제/가정 정리
- L1 (60~90m): 최소 동작 구현
- L2 (20m): 실제 시나리오 검증
- L3 (15m): 수정/정리 + 다음 루프 조건

### 루프 DoD
- 데모 가능한 상태
- 로그/에러 확인 경로 명시
- 다음 루프 진입 조건 1줄 기록
- `CHANGELOG.md` 반영
