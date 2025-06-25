# Trinity Mecha Academy - UI/UX 디자인 문서

## 1. 프로젝트 개요

### 1.1 프로젝트 정보
- **프로젝트명**: Trinity Mecha Academy (TMA) Manager
- **타입**: 메카 전투 관리 시뮬레이션 게임
- **플랫폼**: 웹 기반 (React + TypeScript)
- **UI 테마**: 사이버펑크 터미널 스타일

### 1.2 설계 철학
- **몰입감**: 사이버펑크 세계관을 반영한 터미널 UI
- **기능성**: 복잡한 게임 시스템을 직관적으로 표현
- **실시간성**: 실시간 전투 시뮬레이션 지원
- **확장성**: 모듈형 컴포넌트 구조

## 2. 전체 디자인 시스템

### 2.1 컬러 팔레트
```css
/* Primary Colors */
--green-primary: #10b981 (main accent)
--cyan-primary: #06b6d4 (secondary accent)
--pink-primary: #ec4899 (highlight)

/* Background Colors */
--bg-primary: #0f172a (slate-900)
--bg-secondary: #1e293b (slate-800)
--bg-tertiary: #334155 (slate-700)

/* Text Colors */
--text-primary: #ffffff
--text-secondary: #94a3b8 (gray-400)
--text-accent: #10b981 (green-400)

/* Status Colors */
--success: #10b981 (green-400)
--warning: #f59e0b (yellow-500)
--danger: #ef4444 (red-500)
--info: #3b82f6 (blue-500)
```

### 2.2 타이포그래피
- **Primary Font**: Orbitron (사이버펑크 헤딩용)
- **Secondary Font**: System Default (본문용)
- **Monospace Font**: 터미널 텍스트용

### 2.3 사이버 스타일 요소
- **Cyber Border**: 네온 글로우 효과의 테두리
- **Glow Effects**: 중요 요소에 발광 효과
- **Scan Lines**: 터미널 스캔라인 애니메이션
- **Matrix Background**: 행렬 배경 효과

## 3. 레이아웃 구조

### 3.1 메인 레이아웃 (GameShell)
```
┌─────────────────────────────────────────────────────┐
│ Header Terminal (Status + Navigation)               │
├─────────────────┬───────────────────────────────────┤
│ Sidebar         │ Main Content Area                 │
│ - Navigation    │ - Scene Components                │
│ - Quick Stats   │ - Dynamic Content                 │
│ - Status Panel  │ - Scrollable                      │
├─────────────────┴───────────────────────────────────┤
│ Bottom Status Bar (System Info + Metrics)          │
└─────────────────────────────────────────────────────┘
```

### 3.2 반응형 디자인
- **Desktop**: 3-column layout
- **Tablet**: 2-column layout, collapsible sidebar
- **Mobile**: Single column, drawer navigation

## 4. 컴포넌트 시스템

### 4.1 기본 컴포넌트

#### CyberButton
```typescript
interface CyberButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'default';
  children: React.ReactNode;
}
```
- **Primary**: 네온 그린 글로우 효과
- **Secondary**: 회색 계열, 호버시 글로우
- **Danger**: 빨간색 경고 버튼
- **Default**: 기본 스타일

#### StatusPanel
- 실시간 시스템 상태 표시
- 애니메이션 상태 표시기
- 연결 상태 모니터링

#### PilotCard
- 파일럿 정보 카드
- 상태 표시 (Active/Inactive)
- 특성 배지 시스템

### 4.2 고급 컴포넌트

#### ASCIIBattlefield
- ASCII 아트 기반 전투 필드
- 실시간 유닛 위치 표시
- 터미널 스타일 렌더링

#### CanvasRenderer
- 2D 캔버스 기반 전투 시뮬레이션
- 실시간 애니메이션 렌더링
- 이펙트 시스템 통합

## 5. 씬(Scene) 별 상세 설계

### 5.1 Hub Scene (작전 지휘부)
```
┌─────────────────────────────────────────────────────┐
│ TRINITY MECHA ACADEMY - COMMAND CENTER              │
├─────────────────┬─────────────────┬─────────────────┤
│ Season Progress │ League Ranking  │ Recent Matches  │
├─────────────────┴─────────────────┴─────────────────┤
│ Active Pilot Roster (Cards)                        │
├─────────────────────────────────────────────────────┤
│ Quick Actions (Match Prep, Pilot Mgmt, Analysis)   │
└─────────────────────────────────────────────────────┘
```

**주요 기능**:
- 시즌 진행도 비주얼 표시
- 리그 순위 실시간 업데이트
- 파일럿 상태 카드 시스템
- 빠른 액션 버튼 그리드

### 5.2 Scouting Scene (파일럿 관리)
```
┌─────────────────────────────────────────────────────┐
│ PILOT SCOUTING & MANAGEMENT                         │
├─────────────────┬───────────────────────────────────┤
│ Filter & Sort   │ Pilot List/Grid                   │
│ - Status        │ - Pilot Cards                     │
│ - Traits        │ - Stats Visualization             │
│ - Dormitory     │ - Action Buttons                  │
├─────────────────┴───────────────────────────────────┤
│ Selected Pilot Details & Actions                    │
└─────────────────────────────────────────────────────┘
```

**주요 기능**:
- 파일럿 필터링 및 정렬
- 상세 통계 표시
- 훈련/휴식 관리
- 영입/해고 시스템

### 5.3 Formation Scene (편성 관리)
```
┌─────────────────────────────────────────────────────┐
│ FORMATION MANAGEMENT                                │
├─────────────────┬───────────────────────────────────┤
│ Formation Slots │ Selection Panel                   │
│ - Knight        │ - Pilot List                      │
│ - Arbiter       │ - Mech List                       │
│ - River         │ - Compatibility Score             │
├─────────────────┴───────────────────────────────────┤
│ Tactical Settings & Preview                         │
└─────────────────────────────────────────────────────┘
```

**주요 기능**:
- 역할별 슬롯 시스템
- 파일럿-메카 호환성 시각화
- 전술 설정 인터페이스
- 편성 미리보기

### 5.4 Battle Scene (전투 시뮬레이션)
```
┌─────────────────────────────────────────────────────┐
│ BATTLE SIMULATION - LIVE                            │
├─────────────┬───────────────────────┬───────────────┤
│ Player Team │ Battlefield Canvas    │ Enemy Team    │
│ - Unit Cards│ - Real-time Render    │ - Unit Cards  │
│ - HP Bars   │ - Effects & Anims     │ - HP Bars     │
│ - Status    │ - Terrain Features    │ - Status      │
├─────────────┴───────────────────────┴───────────────┤
│ Combat Log & System Messages                        │
└─────────────────────────────────────────────────────┘
```

**주요 기능**:
- 실시간 전투 캔버스
- 유닛 상태 패널
- 전투 로그 시스템
- 이펙트 애니메이션

### 5.5 Ban/Pick Scene (전략적 선택)
```
┌─────────────────────────────────────────────────────┐
│ BAN/PICK STRATEGY PHASE                             │
├─────────────────┬───────────────────────────────────┤
│ Player Side     │ Enemy Side                        │
│ - Banned Mechs  │ - Banned Mechs                    │
│ - Selected      │ - Selected                        │
├─────────────────┴───────────────────────────────────┤
│ Available Mechs Grid                                │
│ - Mech Cards with Stats                             │
│ - Selection Controls                                │
└─────────────────────────────────────────────────────┘
```

**주요 기능**:
- 단계별 밴/픽 시퀀스
- 메카 선택 인터페이스
- AI 자동 선택 시스템
- 전략적 분석 표시

## 6. 상호작용 설계

### 6.1 네비게이션 패턴
- **Primary Navigation**: 사이드바 기반
- **Secondary Navigation**: 탭 시스템
- **Breadcrumb**: 현재 위치 표시
- **Back Button**: 이전 단계 복귀

### 6.2 상태 피드백
- **Loading States**: 사이버 스타일 스피너
- **Success States**: 녹색 글로우 효과
- **Error States**: 빨간색 경고 표시
- **Progress States**: 진행률 바

### 6.3 애니메이션 시스템
- **Scene Transitions**: 페이드 인/아웃
- **Component Animations**: 마이크로 인터렉션
- **Battle Effects**: 파티클 시스템
- **Status Updates**: 펄스 애니메이션

## 7. 데이터 시각화

### 7.1 통계 표시
- **Pilot Stats**: 레이더 차트
- **Battle Performance**: 바 차트
- **Season Progress**: 프로그레스 바
- **Team Comparison**: 비교 차트

### 7.2 실시간 모니터링
- **Battle Status**: 실시간 업데이트
- **Connection Status**: 상태 표시기
- **System Health**: 메트릭 패널
- **Log Streaming**: 실시간 로그

## 8. 반응형 및 접근성

### 8.1 반응형 디자인
```css
/* Breakpoints */
@media (max-width: 768px) {
  /* Mobile optimizations */
}

@media (min-width: 769px) and (max-width: 1024px) {
  /* Tablet optimizations */
}

@media (min-width: 1025px) {
  /* Desktop optimizations */
}
```

### 8.2 접근성 고려사항
- **키보드 네비게이션**: 모든 요소 접근 가능
- **색상 대비**: WCAG 2.1 AA 준수
- **스크린 리더**: 시맨틱 마크업
- **포커스 관리**: 명확한 포커스 표시

## 9. 성능 최적화

### 9.1 렌더링 최적화
- **React.memo**: 불필요한 리렌더링 방지
- **useMemo/useCallback**: 계산 최적화
- **Lazy Loading**: 코드 분할
- **Canvas Optimization**: 프레임 레이트 관리

### 9.2 상태 관리
- **Zustand**: 전역 상태 관리
- **Local State**: 컴포넌트 별 상태
- **Caching**: 데이터 캐싱 전략
- **Debouncing**: 입력 최적화

## 10. 개발 가이드라인

### 10.1 컴포넌트 명명 규칙
- **Scene Components**: `[Name]Scene.tsx`
- **UI Components**: `[Name].tsx`
- **Hook Components**: `use[Name].tsx`
- **Utility Components**: `[name]Utils.ts`

### 10.2 스타일 가이드라인
- **CSS Classes**: 의미적 명명
- **Tailwind Usage**: 유틸리티 클래스 우선
- **Custom Styles**: 사이버 테마 전용
- **Responsive Design**: 모바일 퍼스트

### 10.3 TypeScript 타입 정의
- **Interface**: 공통 타입 정의
- **Type Guards**: 타입 안정성
- **Generic Types**: 재사용 가능한 타입
- **Strict Mode**: 엄격한 타입 검사

## 11. 향후 개선 방향

### 11.1 단기 개선사항
- **Loading States**: 더 나은 로딩 UX
- **Error Handling**: 사용자 친화적 에러 처리
- **Accessibility**: 접근성 개선
- **Performance**: 렌더링 최적화

### 11.2 장기 개선사항
- **Theme System**: 다크/라이트 테마
- **Customization**: 사용자 UI 커스터마이징
- **PWA Features**: 오프라인 지원
- **Real-time Sync**: 멀티플레이어 지원

## 12. 결론

Trinity Mecha Academy의 UI/UX는 사이버펑크 세계관을 충실히 반영하면서도 복잡한 게임 시스템을 직관적으로 표현하는 것을 목표로 합니다. 모듈형 컴포넌트 구조를 통해 확장성을 확보하고, 실시간 전투 시뮬레이션을 위한 고성능 렌더링 시스템을 구축했습니다.

향후 사용자 피드백을 바탕으로 지속적인 개선을 통해 더 나은 사용자 경험을 제공할 예정입니다. 