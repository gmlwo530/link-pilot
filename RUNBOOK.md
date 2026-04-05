# RUNBOOK - link-pilot

## 실행
```bash
cd /Users/choiheejae/.openclaw/workspace
node link-pilot/server/src/index.js
```
정상 로그:
- `[link-pilot] server listening on http://127.0.0.1:4312`

## Chrome Extension 로드
1. `chrome://extensions` 이동
2. `개발자 모드` ON
3. `압축해제된 확장 프로그램 로드`
4. `.../link-pilot/extension` 선택

## 단축키
- 기본: `⌘ + ⌥ + ⇧ + B`
- 변경: `chrome://extensions/shortcuts`

## 스모크 테스트
1. 웹페이지에서 단축키로 저장
2. 팝업에서 목록 반영 확인
3. 항목 상태(read/unread) 변경 확인

## 1분 데모
1. 페이지 2개 저장
2. unread 목록 확인
3. 첫 항목 `요약/재시도` 실행
4. 두 번째 항목 태그 입력/저장
5. `#ai` 태그 필터 확인
6. Export 다운로드 확인

## 트러블슈팅
- 저장 안 됨: `/health` 확인
- 단축키 반응 없음: 충돌 확인 후 재설정
- 요약 실패: 네트워크 확인 후 재시도 (fallback 요약 제공)
