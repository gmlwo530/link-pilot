# link-pilot

Chrome Extension + local server + SQLite 기반의 개인 북마크 워크플로우 프로젝트.

웹에서 발견한 링크를 빠르게 저장하고, 저장된 북마크에 AI agent가 접근해서 아직 읽지 않은 자료를 요약하고 큐레이션하는 것을 목표로 한다.

## Product Goal

link-pilot은 단순 북마크 저장 도구가 아니라, **"나중에 읽을 자료"를 실제로 소비 가능하게 바꿔주는 북마크 copilot**을 지향한다.

핵심 방향:
- 웹페이지를 빠르게 저장
- 저장한 자료를 구조화해서 관리
- unread 자료를 우선 파악
- AI가 내용 요약을 보조
- 중요도/주제 기준으로 큐레이션

## MVP Scope

1. `⌘ + ⌥ + ⇧ + B` 로 현재 탭 저장
2. 로컬 서버 API를 통해 SQLite에 북마크 저장
3. 저장된 북마크 목록 조회
4. unread 상태 확인 및 관리
5. 요약 요청 API 또는 placeholder 연결

## Current Status

- [x] 로컬 아키텍처 초안 정리
- [x] 서버/익스텐션 초기 스캐폴딩
- [x] Ralph-style loop 기반 개발 흐름 정의
- [ ] 북마크 저장 API 실제 동작 확인
- [ ] 익스텐션 단축키 저장 연동 확인
- [ ] unread 리스트 UX 보강
- [ ] 요약 요청 흐름 연결

## Architecture

- `server/` — 로컬 API (`127.0.0.1` 바인딩), DB 접근, 요약 요청 진입점
- `extension/` — Chrome Extension UI, 단축키, 현재 탭 저장 트리거
- `docs/` — 개발 루프, 데모, 설치/실행 문서

## Core User Flow

1. 사용자가 웹페이지를 연다
2. 단축키 또는 익스텐션 UI로 저장한다
3. link-pilot이 URL/제목/메타데이터를 저장한다
4. 사용자는 unread 목록을 본다
5. AI가 unread 자료를 요약하거나 큐레이션한다

## Documents

- `AGENTS.md` — 이 프로젝트에서 에이전트가 따를 작업 방식과 규칙
- `docs/LOOP.md` — 짧은 반복 개발 루프 정의
- `docs/SETUP.md` — 실행/설치 방법
- `docs/DEMO.md` — 데모 중심 사용 흐름

## Notes

이 프로젝트는 초기부터 **서브에이전트를 활용한 분업형 개발**을 염두에 두고 있다.
작업은 가능하면 작은 루프로 나누고, 각 루프마다 데모 가능한 결과와 다음 루프 진입 조건을 남기는 것을 원칙으로 한다.
