# 🛠️ Battle Simulation Refactoring Plan (v2025-06-20)

> **대상 모듈**: `client/src/components/BattleSimulation.tsx` 및 관련 로직 (`shared/ai/utils`, `stores/battleStore`, `presentation/CanvasRenderer` 등)
>
> **작성자**: SASHA (AI 파트너)

---

## 1. Refactor 목적
1. **가독성 향상** – 1,000+ 라인 복합 컴포넌트를 SRP 단위로 분리.
2. **성능 최적화** – 렌더 루프와 게임 로직 분리, 불필요한 React state 재렌더 제거.
3. **테스트 용이성** – AI 결정·전투 판정 로직을 pure function/worker 로 이동하여 Vitest 단위 테스트 적용.
4. **확장성 확보** – 서버 권한 구조(Authoritative Server)와 Web Worker 확장 대비.

## 2. 현황 문제점 🔍
| 카테고리 | 증상 |
| --- | --- |
| 구조 | UI · 게임루프 · AI · 이펙트가 단일 파일에 혼재 |
| 성능 | `setInterval` + `useState` 남발 → 과도한 리렌더 & GC |
| 테스트 | 비동기·랜덤 의존 → 단위 테스트 작성 난이도 높음 |
| 확장 | 멀티플레이/PVP 전환 시 클라 판정 구조가 병목 |

## 3. 목표 아키텍처 🏗️
```mermaid
flowchart TD
  subgraph UI Thread
    A[BattleSimulation (Presenter)]
    A -->|props| CanvasRenderer
    A -->|hook| useBattleRender
  end

  subgraph Worker "Game Worker Thread"
    B[GameLoop.ts] --> C[AISystem.ts]
    B --> D[EffectManager.ts]
  end

  battleStore <--> B
  battleStore <--> A
```

* **GameLoop.ts (Worker)** – 60 FPS or △1s logic tick, postMessage 로 state diff 송신
* **AISystem.ts** – decision core (공유 코드 /server/domain/AISystem.ts 재사용)
* **EffectManager.ts** – 공격 이펙트 풀링 & lifecycle 관리
* **useBattleRender** – CanvasLayer pre-render 캐싱, DPR 대응

## 4. 단계별 작업 🗂️

### Phase A) 모듈 분리 (1~2일)
- [ ] `BattleSimulation.tsx` → Presenter 역할만 남기고 로직 제거
- [ ] `hooks/useBattleRender.ts` 신설 – 캔버스 드로잉 전담
- [ ] `logic/GameLoop.ts` 작성 – 기존 tick 로직 이관

### Phase B) Web Worker 도입 (2~3일)
- [ ] Vite `worker` 플러그인 설정
- [ ] GameLoop + AI 로 Worker 구동, postMessage API 설계
- [ ] 메인 스레드와 상태 sync (immer patch or diff)

### Phase C) AI 결정 통합 (2일)
- [ ] `/shared/ai` → `/shared/ai/decision.ts` 로 추상화
- [ ] 서버 `domain/AISystem.ts` 코드 공유 (ts-paths alias)

### Phase D) 렌더 최적화 (1~2일)
- [ ] 지형 레이어 off-screen canvas 캐싱
- [ ] 텍스트 Overlay DOM 분리 (파일럿 이름/HP)
- [ ] DPR(scale) 지원 & resize debounce

### Phase E) 테스트 & 문서 (1일)
- [ ] Vitest: AI decision, victory condition, tick timing
- [ ] Storybook(or simple page) for CanvasRenderer demo
- [ ] README 업데이트

> 총 소요: **약 8~10 dev-days** (버퍼 포함 2주)

## 5. 작업 체크리스트 ☑️
- [ ] eslint 통과 & 기존 lint rule 유지
- [ ] vitest 90%+ 커버리지 (AI/Tick)
- [ ] 게임 플레이 기존 기능 100% 유지 (회귀 테스트)
- [ ] Lighthouse FPS > 55 on mid-range laptop

## 6. 위험 & 대응 🚧
| 위험 | 대응 |
| --- | --- |
| Worker 메시지 병목 | diff 최소화, transferable object 사용 |
| 동기화 버그 | redux-devtools style time-travel 디버그 도구 적용 |
| 일정 지연 | 단계별 Merge Request & 피드백, 롤백 스위치 유지 |

## 7. 로드맵 매핑 📅
* **Phase 1.3 통신 로그 시스템** – 렌더 분리 후 Overlay 확장 용이
* **Phase 2.1 밴픽 시스템** – 서버 authoritative 구조 전제
* **Phase 4.1 고급 AI** – Worker 구조 위에 ML/BT 확장 배치

## 8. 완료 기준 ✅
1. `BattleSimulation.tsx` 라인 수 250↓.
2. 메인 쓰레드 FPS 향상(>+20%).
3. vitest 전투 시뮬 단위 테스트 20개 이상 통과.
4. Roadmap Phase 1 남은 태스크(1.2, 1.3) 개발에 지장 없음 증명.

---

> **다음 액션**: 코드 리팩토링 Branch `feature/refactor-battle-sim` 생성 후 Phase A 착수. 