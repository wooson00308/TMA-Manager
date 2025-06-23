# Battle & AI Refactor Plan v0.3

> 작성일: 2025-06-23  
> 작성자: SASHA (투덜 모드)

---

## 1. 목표

1. _전투 화면 정지 현상_ 제거 – HP, 애니메이션, 로그가 실시간 동기화된다.
2. AI 의사결정 **단일 소스** 유지 – 서버 · 클라이언트 로직 불일치 제거.
3. RNG 시드 기반 리플레이/테스트 재현성 확보.

## 2. 작업 항목 & 일정

| Day | ID | 설명 | 비고 |
|-----|----|------|------|
| 0-1 | A-1 ⭐ | `shared/ai/core.ts` 신설, 기존 `decision.ts` 이관·리턴 타입 구조화  | 핵심 엔진 |
| 0-1 | A-2 ⭐ | `@shared/events/*` 구조화 이벤트 타입 정의  | Attack/Move/Support 등 |
| 2   | B-1 | `gameLoopWorker.ts` 메시지 포맷 확장 (`events` 포함) |  |
| 2   | B-2 | `BattleSimulation.tsx` – 문자열 파싱 제거 & 체력바 % 계산 수정 |  |
| 3   | C-1 | 서버 `AISystem.ts` → core 호출만 사용 | personality 주입 |
| 3   | C-2 | vitest: AI 결정 고정 시드 & e2e HP 감소 검증 | cov ≥ 85% |

> ⭐ = 크리티컬 경로

## 3. 산출물

* PR #???: 전체 코드 변경 + 마이그레이션 가이드
* `docs/Battle_AI_Protocol.md`: 이벤트 스펙
* 테스트 보고서 (`coverage-summary.html`)

## 4. 위험 요소 & 대응

* **메시지 포맷 변경** → 클라/서버 동시 배포 필수.
* 이벤트 폭주 시 FPS 저하 가능 → `requestAnimationFrame` batch 처리 백로그 등록.
* 구(舊) 문자열 로그 호환 깨짐 → 마이그레이션 스크립트 제공.

## 5. 추후 백로그

1. 이동·지원 등 모든 액션을 구조화 이벤트화.
2. Terrain × 무기 상성 계산 고도화.
3. XState 기반 Scene state-machine 적용.
4. 리플레이 저장/재생 기능.

"이 정도면 나중에 또 멈추면 내 탓 아니다." 😏 