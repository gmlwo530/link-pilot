# AGENTS.md — link-pilot 작업 규칙

이 프로젝트에서 에이전트는 단순 코드 생성기가 아니라, **제품 목표를 유지하면서 작은 루프로 구현을 전진시키는 오너/실행자**로 행동한다.

## Project Intent

link-pilot의 목표는:
- Chrome Extension으로 웹페이지를 빠르게 저장하고
- 로컬 저장소(SQLite)에 축적하고
- 저장된 북마크를 AI agent가 접근 가능하게 하며
- 아직 읽지 않은 자료를 요약/큐레이션하게 만드는 것

## Operating Style

이 프로젝트는 **Ralph-style loop**로 진행한다.

기본 흐름:
1. 목표와 완료 조건 정의
2. 작업을 작은 단위로 분해
3. 가능하면 서브에이전트로 병렬 처리
4. 결과를 검증
5. 다음 루프를 재계획

## Preferred Round Types

- **planning round**: 요구사항, 구조, 인터페이스, 리스크 정리
- **build round**: 실제 구현
- **verification round**: 동작 확인, 로그 확인, acceptance criteria 검증
- **recovery round**: 막힌 부분 축소/우회/재설계

한 라운드에서 너무 많은 목표를 섞지 말 것.

## Definition of Done (per loop)

각 루프는 아래 3가지를 남겨야 한다:
- 데모 가능한 결과
- 로그/에러 확인 경로
- 다음 루프 진입 조건 한 줄

## Sub-agent Usage

서브에이전트는 아래 경우 적극 활용한다:
- 독립된 작업 브랜치가 2개 이상 있을 때
- 스펙/구현/검증을 병렬로 진행할 수 있을 때
- 한 작업이 꽤 길거나 집중된 컨텍스트를 요구할 때

예시 역할:
- PM/spec 에이전트
- extension 에이전트
- backend 에이전트
- AI/summarization 에이전트
- QA/verification 에이전트

작은 단일 수정은 굳이 서브에이전트로 쪼개지 말 것.

## Implementation Heuristics

- 항상 가장 작은 동작 가능한 단위부터 만들 것
- 먼저 end-to-end로 얇게 연결하고, 그 다음 품질을 올릴 것
- 로컬에서 검증 가능한 구조를 우선할 것
- 에러가 나면 원인과 재현 경로를 문서에 남길 것
- 미완료 상태라도 다음 사람이 이어받기 쉽게 남길 것

## Current Product Priorities

우선순위는 아래 순서를 기본으로 한다:
1. 저장 성공률
2. unread 관리 흐름
3. 요약 요청 파이프라인
4. 큐레이션 품질
5. UX polish

## Commit / Documentation Expectations

- 커밋은 한 루프의 결과를 설명할 수 있어야 한다
- 문서를 바꾸면 README / docs / AGENTS 중 맞는 위치에 반영할 것
- 프로젝트 방향이 바뀌면 README와 AGENTS.md를 함께 갱신할 것

## What to Surface to the User

중간 보고는 짧고 실무적으로 한다:
- 이번 라운드 목표
- 실제로 끝난 것
- 막힌 것
- 다음 라운드 제안

장황한 설명보다, 바로 다음 행동으로 이어지는 정리가 더 중요하다.
