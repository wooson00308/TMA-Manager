# Trinity Mecha Academy - 로컬 개발 환경 설정

이 프로젝트를 로컬에서 실행하기 위한 가이드입니다.

## 필요 조건

- Node.js (버전 18 이상)
- npm 또는 yarn

## 설치 및 실행

1. **저장소 클론**
   ```bash
   git clone <repository-url>
   cd trinity-mecha-academy
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```

4. **브라우저에서 접속**
   ```
   http://localhost:5000
   ```

## 프로젝트 구조

```
trinity-mecha-academy/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/     # UI 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── hooks/          # React 훅
│   │   ├── lib/            # 유틸리티 및 설정
│   │   └── stores/         # 상태 관리
├── server/                 # Express 백엔드
│   ├── services/           # 비즈니스 로직
│   ├── routes.ts           # API 라우트
│   ├── storage.ts          # 데이터 저장소
│   └── index.ts            # 서버 진입점
├── shared/                 # 공유 타입 및 스키마
└── package.json
```

## 게임 기능

- **사령부**: 팀 관리 및 파일럿 현황
- **파일럿 스카우팅**: 신규 파일럿 채용 및 훈련
- **경기 준비**: 밴픽 시스템 및 로스터 관리
- **전투 분석**: AI 기반 실시간 전투 시뮬레이션

## 개발 도구

- **프론트엔드**: React + TypeScript + Vite
- **백엔드**: Express + TypeScript
- **스타일링**: Tailwind CSS + shadcn/ui
- **상태 관리**: Zustand + TanStack Query
- **실시간 통신**: WebSocket

## 문제 해결

### WebSocket 연결 오류
로컬 환경에서는 `ws://localhost:5000/ws`로 연결됩니다. 포트가 다르다면 `client/src/lib/websocket.ts`에서 수정하세요.

### 포트 충돌
기본 포트 5000이 사용 중이라면 `server/index.ts`에서 포트를 변경할 수 있습니다.

## 라이선스

이 프로젝트는 개발 목적으로 제작되었습니다.