# link-pilot

Chrome Extension + local server + SQLite 기반 개인 북마크 copilot.

## Quick Start
1. 서버 실행
```bash
cd /Users/choiheejae/.openclaw/workspace
node link-pilot/server/src/index.js
```
2. Chrome에서 `chrome://extensions` → 개발자 모드 ON
3. `압축해제된 확장 프로그램 로드`로 `link-pilot/extension` 선택
4. 단축키 `⌘ + ⌥ + ⇧ + B` 로 저장 테스트

## Documents
### Core
- `README.md` — 인덱스 + 빠른 시작
- `AGENTS.md` — 에이전트 작업 원칙/운영 방식
- `PRODUCT.md` — 제품 목표/범위/우선순위
- `ENGINEERING.md` — 기술 명세/API/개발 루프
- `RUNBOOK.md` — 실행/검증/데모/트러블슈팅
- `.env.example` — 환경 변수 기준
- `CHANGELOG.md` — 변경 이력

## Repo Structure
- `server/` — 로컬 API 및 DB 접근
- `extension/` — Chrome Extension UI/저장 트리거
