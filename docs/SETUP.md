# link-pilot 설치 가이드

## 1) 서버 실행
```bash
cd /Users/choiheejae/.openclaw/workspace
node link-pilot/server/src/index.js
```

정상 실행 로그:
- `[link-pilot] server listening on http://127.0.0.1:4312`

## 2) 크롬 익스텐션 로드
1. Chrome 열기 → `chrome://extensions`
2. 우측 상단 `개발자 모드` ON
3. `압축해제된 확장 프로그램을 로드합니다` 클릭
4. 폴더 선택: `.../link-pilot/extension`

## 3) 단축키 확인/변경
- 기본값: `⌘ + ⌥ + ⇧ + B`
- 변경: `chrome://extensions/shortcuts`

## 4) 동작 확인
1. 아무 웹페이지에서 단축키 입력
2. 익스텐션 아이콘 클릭
3. 리스트에 URL/제목이 보이면 성공

## 5) 자주 쓰는 기능
- 읽음/다시 unread
- 메모/태그 저장
- 요약/재시도
- 태그 칩 필터
- 정렬(최신/오래된)
- 전체 읽음/전체 unread
- JSON Export/Import

## 6) 트러블슈팅
- 저장 안 됨: 서버 실행 여부 확인 (`/health`)
- 단축키 반응 없음: 단축키 충돌 확인 후 재지정
- 요약 실패: 네트워크 상태 확인 후 재시도 (fallback 요약 제공)
