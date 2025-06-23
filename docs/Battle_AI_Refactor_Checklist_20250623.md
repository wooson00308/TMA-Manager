# Battle & AI Refactor – Checklist (2025-06-23)

> 진행 상황은 ☑ 체크박스로 업데이트

---

## Phase A – Core & 이벤트 정의 (Day 0-1)

☑ **A-1** `shared/ai/core.ts` 생성 및 `decision.ts` 로직 이관
  ☑ ` └` 반환 타입을 구조화 `AIDecision` → `GameEvent[]` 포함 형태로 변경
  ☑ ` └` RNG 시드 인젝션 파라미터 추가
☑ **A-2** `@shared/events/*` 폴더에
  ☑ `AttackEvent`
  ☑ `MoveEvent`
  ☑ `SupportEvent`
  ☑ `GameEvent` 유니언 정의

## Phase B – Worker & UI 연동 (Day 2)

☑ **B-1** `gameLoopWorker.ts`
  - ☑ 메시지 포맷 `STATE_UPDATE → { state, events }` 로 확장
  - ☑ INIT/START/STOP 로깅 유지
☑ **B-2** `BattleSimulation.tsx`
  - ☑ 문자열 로그 파싱 제거
  - ☑ `events` 배열 소비하여 AttackEffect / HP 갱신
  - ☑ 체력바 % 계산 `hp / maxHp * 100` 적용

## Phase C – 서버 AI & 테스트 (Day 3)

☑ **C-1** `server/domain/AISystem.ts` → `shared/ai/core` 직접 호출
  - ☑ personalityMap 외부 주입 처리
☑ **C-2** 테스트 보강
  - ☑ vitest : 고정 시드로 결정 일관성 검증
  - ☑ e2e "한 턴 실행 → events.length ≥1 && hp 변화" 확인

## 산출물 & 문서

- [ ] PR 링크 추가
- [ ] `docs/Battle_AI_Protocol.md` 작성
- [ ] 테스트 커버리지 ≥ 85% 확인

---

"표 체크하고 나면 핑계 없지?" 😏 