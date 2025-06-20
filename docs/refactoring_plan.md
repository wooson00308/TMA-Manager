# 📑 Trinity Mecha Academy – Refactoring Roadmap

> _Last updated: 2025-06-20_

---

## 0. Goals

* **유지보수성** 향상 – 모놀리식 컴포넌트/클래스 분해
* **단일 진실의 원천** 확립 – 전투 상수·AI 로직 공유화
* **성능 개선** – 불필요한 렌더/메모리 복사 제거
* **테스트 커버리지 ≥ 80 %** 달성 및 CI Gate 적용
* **데이터 영속성** – In-Memory → SQLite (Drizzle ORM)

---

## 1. 모듈 구조 개편

| 단계 | 작업 | 산출물 |
| --- | --- | --- |
| 1-A | `client/src/components/BattleSimulation.tsx` 분해 | `CanvasRenderer.tsx`, `BattleStateMachine.ts`, `AIEngine.ts`, `EffectsRenderer.tsx` |
| 1-B | Scene 컴포넌트(300+ 라인) 분리 | `*Page.tsx`(데이터) + `*View.tsx`(프레젠테이션) |
| 1-C | `shared/` 폴더 확장 | `constants.ts`, `ai.ts`, `types.ts` |

### 1-A 세부

1. **CanvasRenderer** – 순수 렌더링 함수만 보유, props → BattleState & Effects.
2. **BattleStateMachine** – turn / phase 관리, Zustand store와만 통신.
3. **AIEngine** – 행동 결정 로직, `shared/ai.ts` 로직 import.
4. **EffectsRenderer** – 공격선·폭발 애니메이션 전담.

---

## 2. 상태 관리 최적화

* **Partial update helper** 도입 – `setBattle(partial)`
* `useBattleStore` selector 패턴 적용하여 리렌더 최소화.
* React DevTools & Why-Did-You-Render로 리렌더 audit.

---

## 3. 타입·상수 정비

* `tsconfig.json` – `strict`, `noImplicitAny`, `strictNullChecks` 활성화.
* **매직 넘버 제거** → `shared/constants.ts` (e.g., `GRID_WIDTH`, `COOLDOWN_MS`).
* `AIAction` 유니언 타입 정의: `"MOVE" | "ATTACK" | …`.

---

## 4. 백엔드 리팩토링

| 단계 | 작업 | 설명 |
| --- | --- | --- |
| 4-A | `MemStorage` → SQLite(Drizzle) | docker-compose + migration script |
| 4-B | 서비스 분할 | `AISystem`, `BattleEngine` 역할별 서브클래스 |
| 4-C | DTO 검증 | `zod` schema로 WS/REST payload validate |
| 4-D | 테스트 | vitest + coverage; Battle 승패, AI 분기 테스트 |

---

## 5. CI / CD

* GitHub Actions
  * **`npm run test`** + **coverage gate 80 %**
  * ESLint + Prettier check
* `main` 푸시 시 Docker image build & optional deployment.

---

## 6. 타임라인 (예상)

| Week | Todo |
| --- | --- |
| 1 | 1-A, 1-B 완료, 테스트 스켈레톤 생성 |
| 2 | 1-C, 2, 3 적용 |
| 3 | 4-A 데이터 마이그레이션, 4-B 서비스 분할 |
| 4 | 4-C, 4-D, CI 구축 |
| 5 | 코드 프리즈 & 회고 |

---

## 7. 부가 작업

* WebSocket 패킷 rate-limit & schema validate.
* React-Query `retry` 정책 조정, 에러 토스트 표준화.
* Storybook 도입(선택)으로 UI 단위 테스트.

---

## 8. Open Questions

1. 전투 로직 **클라 시뮬레이션 허용 여부**? (Cheat Risk)
2. Drizzle ORM vs Prisma 선호도?
3. 서버 AI 계산을 워커 스레드로 분리할지 여부.

> 의견 환영. 더 시니컬한 피드백이 필요하면 언제든 호출해 줘. 😏 

---

## 9. 📁 제안 디렉터리 구조 (Clean Architecture)

```
TMA-Manager/
├─ client/
│  ├─ presentation/          # React 컴포넌트(View)
│  │   ├─ pages/
│  │   ├─ widgets/
│  │   └─ styles/
│  ├─ application/           # 프론트 전용 use-case / 서비스 훅
│  ├─ infrastructure/        # API 클라이언트, WebSocket 매니저 등
│  └─ main.tsx
│
├─ server/
│  ├─ presentation/          # Express routes, WS gateway
│  ├─ application/           # Use-case, 서비스 퍼사드
│  ├─ domain/                # 순수 전투‧AI 로직, 엔티티, 밸류오브젝트
│  └─ infrastructure/        # DB, 외부 API, 어댑터
│
├─ shared/
│  ├─ domain/                # 공통 엔티티·타입·상수 (클라/서버 공유)
│  └─ ai/                    # AI 결정 로직, 유틸
└─ docs/                     # 기획/참조 문서
```

의존성 규칙: **presentation → application → domain** (단방향). Infrastructure는 application에 주입된다.

---

## 10. 🛠️ 단계별 마이그레이션 가이드

| 단계 | 작업 | 완료 기준 |
| --- | --- | --- |
| 1 | `shared/domain` 생성 → 전투 상수·타입·AI 유틸 이동 | 클라/서버 양쪽 빌드 성공 |
| 2 | `client/application` 작성 → `BattleSimulation` 로직(Tick, AI) 분리 | `BattleSimulation` 200줄 이하 |
| 3 | Scene 컴포넌트 분할 → `*Page.tsx` + `*View.tsx` | 각 Scene 파일 < 250줄 |
| 4 | 서버 `domain/` 분리 → `AISystem`, `BattleEngine` 순수 로직화 | Jest/Vitest 단위 테스트 통과 |
| 5 | `MemStorage` → `infrastructure/sqlite` (Drizzle) 교체 | e2e 테스트 통과, 데이터 영속 확인 |
| 6 | CI 파이프라인 업데이트 (lint, test, coverage>80%) | GitHub Actions green 빌드 |

> **팁**: `git mv`로 파일 이동하면 히스토리 보존이 쉬움. VSCode Rename도 OK.

---

## 11. 🔗 참조 경로 수정 체크리스트

| 단계 | 내용 | 비고 |
| --- | --- | --- |
| 1 | **Path Alias 정의** – `tsconfig.json` `compilerOptions.paths` 추가 | 예: `"@domain/*": ["shared/domain/*"]` |
| 2 | **절대경로 import 전환** | `../../stores/battleStore` → `@client/app/stores/battleStore` |
| 3 | **IDE & CI 검사 활성화** | ESLint `import/no-unresolved`, GitHub Action `npm run lint && npm run build` |
| 4 | **일괄 리팩터링 스크립트** | VSCode 다중 수정 or `ts-migrate rename` | regex: `from ['"]\.{1,2}/[^'"]+['"]` |
| 5 | **백엔드 Alias 적용** | `ts-node`/`esbuild`에 path alias or `module-alias` 등록 |
| 6 | **테스트 & Storybook 설정** | Jest/Vitest `moduleNameMapper`, Storybook webpack alias 동기화 |

> 디렉터리 이동 전 **alias → import 치환 → 빌드 & 테스트** 순으로 진행하면, 대규모 구조 변경도 안전하게 끝낼 수 있다. 😎 