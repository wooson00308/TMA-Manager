# 🤖 Trinity Mecha Academy Manager
![image](https://github.com/user-attachments/assets/d498052c-6ab0-4d88-8448-99c7e0fbc8a2)
> **사이버펑크 메카 전투 시뮬레이션 & 팀 관리 게임**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

## 🌟 개요

Trinity Mecha Academy는 사이버펑크 세계관의 메카 전투 시뮬레이션 게임입니다. 파일럿을 훈련하고, 메카를 선택하며, 전략적 전투를 통해 리그 최고의 팀을 만들어보세요.

### ✨ 주요 특징

- 🎮 **실시간 전투 시뮬레이션** - Canvas 기반 2D 전투 렌더링
- 👥 **파일럿 관리 시스템** - 스카우팅, 훈련, 능력치 관리
- 🤖 **지능형 AI 시스템** - 전술적 의사결정을 하는 적 AI
- ⚔️ **TFM 스타일 밴픽** - Team Fight Manager 방식의 전략적 선택
- 🎨 **사이버펑크 UI** - 터미널 스타일의 몰입감 있는 인터페이스
- 🔄 **실시간 통신** - WebSocket 기반 멀티플레이어 지원

## 🏗️ 기술 스택

### Frontend
- **React 18** + **TypeScript** - 모던 웹 개발
- **Tailwind CSS** - 유틸리티 퍼스트 스타일링
- **Zustand** - 가벼운 상태 관리
- **React Query** - 서버 상태 관리
- **Canvas API** - 2D 게임 렌더링
- **Web Workers** - 게임 루프 최적화

### Backend
- **Node.js** + **Express** - 서버 프레임워크
- **TypeScript** - 타입 안전성
- **SQLite** + **Drizzle ORM** - 데이터베이스
- **WebSocket** - 실시간 통신
- **Vitest** - 테스트 프레임워크

## 🚀 빠른 시작

### 필수 요구사항
- Node.js 18.x 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 저장소 클론 (실제 레포 주소로 변경 필요)
git clone https://github.com/wooson00308/TMA-Manager.git
cd TMA-Manager

# 의존성 설치
npm install

# 환경 변수 설정 (아래 환경 변수 섹션 참조)
cp .env.example .env

# 데이터베이스 초기화
npm run db:setup

# 개발 서버 시작
npm run dev
```

서버와 클라이언트가 동시에 실행됩니다:
- 🌐 **Frontend**: http://localhost:5173
- 🔧 **Backend**: http://localhost:3000

## 🔐 환경 변수

프로젝트 실행을 위해 필요한 환경 변수들을 설정해주세요.

```bash
# .env.example을 복사하여 .env 파일 생성
cp .env.example .env
```

**필수 환경 변수:**
```env
# 서버 설정
PORT=3001
HOST=localhost

# 데이터베이스
DATABASE_URL=./database.sqlite

# WebSocket 설정
WS_PORT=3002

# 개발 모드 설정
NODE_ENV=development

# 게임 설정
MAX_PILOTS_PER_TEAM=8
BATTLE_TURN_DURATION=2000
```

> **참고:** `.env.example` 파일을 생성하여 기본 설정값을 제공할 예정입니다.

## 🎮 게임 플레이

### 1. 파일럿 관리
- **스카우팅**: 새로운 파일럿 영입
- **훈련**: 반응속도, 정확도, 전술, 팀워크 향상
- **관리**: 피로도와 사기 관리

### 2. 전략 수립
- **밴픽 단계**: 상대팀과 전략적 메카 선택
- **편성 구성**: 파일럿-메카 매칭 최적화
- **전술 설정**: 공격적/방어적/기동전/균형 전술 선택

### 3. 실시간 전투
- **실시간 시뮬레이션**: 2D 필드에서 펼쳐지는 전투
- **전술적 요소**: 지형, 사거리, 위치선정
- **AI 대결**: 지능적인 적 AI와의 두뇌 싸움

## 📁 프로젝트 구조

```
TMA-Manager/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/     # 재사용 가능한 컴포넌트
│   │   │   ├── scenes/     # 게임 씬 컴포넌트
│   │   │   └── ui/         # UI 컴포넌트 라이브러리
│   │   ├── hooks/          # 커스텀 React 훅
│   │   ├── stores/         # Zustand 스토어
│   │   ├── logic/          # 게임 로직
│   │   ├── workers/        # Web Workers
│   │   └── presentation/   # 렌더링 로직
│   ├── index.html
│   └── package.json
├── server/                 # Express 백엔드
│   ├── domain/             # 비즈니스 로직
│   │   ├── BattleEngine.ts # 전투 엔진
│   │   └── AISystem.ts     # AI 시스템
│   ├── application/        # 애플리케이션 서비스
│   ├── services/           # 도메인 서비스
│   ├── __tests__/          # 테스트 파일
│   └── index.ts            # 서버 진입점
├── shared/                 # 공유 타입 정의
│   ├── domain/             # 도메인 타입
│   └── ai/                 # AI 관련 타입
├── docs/                   # 프로젝트 문서
├── .gitignore
├── package.json
└── README.md
```

## 🎯 핵심 기능

### 🤖 AI 시스템
```typescript
// 지능적인 AI 의사결정
class AISystem {
  makeDecision(participant, battleState, team) {
    // 전술적 분석
    // 상황 판단
    // 최적 행동 선택
  }
}
```

### ⚔️ 전투 엔진
```typescript
// 실시간 전투 시뮬레이션
class BattleEngine {
  processTurn(battleState) {
    // 행동 처리
    // 피해 계산
    // 상태 업데이트
  }
}
```

### 🎨 사이버 UI
```css
/* 사이버펑크 스타일 컴포넌트 */
.cyber-border {
  border: 1px solid #00ffff;
  background: rgba(0, 255, 255, 0.1);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}
```

## 🧪 테스트

```bash
# 유닛 테스트 실행
npm test

# 커버리지 확인
npm run test:coverage

# E2E 테스트
npm run test:e2e
```

## 📊 개발 상태

- ✅ **파일럿 관리 시스템**
- ✅ **메카 선택 및 편성**
- ✅ **밴픽 시스템**
- ✅ **실시간 전투 시뮬레이션**
- ✅ **AI 전술 시스템**
- 🚧 **멀티플레이어 모드**
- 🚧 **리그 시스템 확장**
- 📋 **모바일 반응형 UI**

## 🤝 기여하기

프로젝트에 기여해주셔서 감사합니다! 다음 가이드라인을 따라주세요.

### 개발 환경 설정
1. Fork the Project
2. Clone your fork (`git clone https://github.com/YOUR_USERNAME/TMA-Manager.git`)
3. Create your Feature Branch (`git checkout -b feature/amazing-feature`)
4. Install dependencies (`npm install`)

### 코딩 컨벤션
- **TypeScript** 사용 및 타입 안전성 유지
- **ESLint** + **Prettier** 규칙 준수
- **함수형 컴포넌트** 및 **React Hooks** 사용
- **Clean Architecture** 패턴 유지

### 커밋 컨벤션
```bash
# 예시
feat: 새로운 파일럿 스카우팅 시스템 추가
fix: 전투 시뮬레이션 버그 수정
docs: README 업데이트
test: 배틀 엔진 테스트 추가
refactor: AI 시스템 리팩토링
```

### 테스트
- 새로운 기능에 대한 테스트 작성 필수
- `npm test` 통과 확인
- 커버리지 80% 이상 유지

### Pull Request
1. 변경 사항을 명확히 설명
2. 관련 이슈 번호 참조 (`Closes #123`)
3. 스크린샷 또는 GIF 첨부 (UI 변경 시)
4. 테스트 결과 확인

### 브랜치 전략
- `main`: 안정 버전
- `develop`: 개발 버전
- `feature/*`: 새로운 기능
- `fix/*`: 버그 수정

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🎖️ 크레딧

- **게임 디자인**: 사이버펑크 및 메카 애니메이션에서 영감
- **UI/UX**: 터미널 및 HUD 인터페이스 디자인
- **AI 시스템**: 전술적 의사결정 알고리즘

---

<div align="center">

**🚀 Trinity Mecha Academy에서 최강의 파일럿 팀을 만들어보세요! 🚀**

[🎮 플레이하기 (로컬 실행 시)](http://localhost:5173) • [📖 문서](./docs) • [🐛 버그 신고](../../issues)

</div> 
