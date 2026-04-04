# link-pilot

로컬 경량 서버 + SQLite + Chrome Extension 기반 북마크 시스템.

## 현재 상태
- [x] Ralph Loop 방식 개발 프레임 정의
- [x] 로컬 아키텍처 초안
- [x] 서버/익스텐션 초기 스캐폴딩
- [ ] 북마크 저장 API 동작 확인
- [ ] 익스텐션 단축키 저장 연동 확인

## 실행 목표 (MVP)
1. `⌘ + ⌥ + ⇧ + B`로 현재 탭 저장
2. SQLite에 북마크 저장
3. unread 목록 조회
4. 요약 요청 API(placeholder) 준비

## 구조
- `server/` 로컬 API (`127.0.0.1` 바인딩)
- `extension/` 크롬 확장
- `docs/` 설계/개발 루프 문서
