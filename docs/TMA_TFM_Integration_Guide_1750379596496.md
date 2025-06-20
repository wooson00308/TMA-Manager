# 🎯 TMA-TFM 통합 설계 가이드
**팀파이트매니저 역기획 분석을 통한 TMA 시스템 설계 방향**

---

## 📋 개요

팀파이트매니저(TFM)의 성공 요소를 분석하여 TMA에 적용 가능한 시스템들을 도출하고, 우리만의 차별화 포인트를 명확히 한다.

---

## 🔍 TFM 핵심 성공 요소 분석

### 1. 밴픽 시스템의 전략적 깊이
**TFM의 접근:**
- 2밴 → 4픽 (스네이크 드래프트)
- 챔피언별 상성 관계 복잡
- 선수 숙련도 + 챔피언 메타 고려

**TMA 적용:**
```
기체 밴픽 시스템:
┌─────────────────────────────────┐
│ 1단계: 상대 정찰 & 분석          │
│ 2단계: 기체 타입 밴 (각 2개)     │
│ 3단계: 기체 픽 (스네이크)        │
│ 4단계: 파일럿 할당 & 배치        │
└─────────────────────────────────┘
```

### 2. 관찰 중심 플레이의 몰입감
**TFM의 성공 포인트:**
- 1분 고정 시간 → 집중도 극대화
- 결과의 불확실성 → 긴장감 유지
- 전투 후 분석 → 학습 동기 부여

**TMA 차별화:**
- 실시간 진행 (고정 시간 없음)
- ASCII + 로그 이중 표현
- 더 세밀한 전투 과정 관찰

### 3. 메타게임의 지속적 변화
**TFM 패치 시스템:**
- 시즌 중간/말 2회 패치
- 승률 기반 자동 밸런스
- 신규 챔피언 추가로 메타 리셋

**TMA 메타 진화:**
```
패치 트리거 조건:
├── 특정 조합 승률 > 70%
├── 기체 타입 픽률 < 10%
├── 시즌 진행도 50%, 100%
└── 플레이어 피드백 임계치
```

---

## 🎮 TMA 고유 차별화 요소

### 1. 실시간 vs 고정시간
| 구분 | TFM | TMA |
|------|-----|-----|
| 전투 시간 | 고정 1분 | 상황에 따라 가변 |
| 긴장감 | 시간 압박 | 상황 변화 |
| 몰입 방식 | 결과 집중 | 과정 집중 |
| 재관람 가치 | 낮음 | 높음 (로그 재분석) |

### 2. AI 복잡도 차이
**TFM AI:**
- 단순화된 행동 패턴
- 예측 가능한 반응
- 조합 중심 전략

**TMA AI:**
- BehaviorTree 기반 복합 판단
- 특성별 개성화된 행동
- 실시간 상황 적응

### 3. 플레이어 역할의 확장
**TFM 플레이어:**
- 감독 역할에 한정
- 밴픽 + 관찰만 가능

**TMA 플레이어:**
- 오퍼레이터 (전술 분석가)
- 사전 정찰 + 전략 수립
- 전투 후 로그 해석 + 개선

---

## 🔧 구체적 적용 시스템

### 1. 밴픽 시스템 설계

#### 정찰 단계 (TFM에 없는 TMA 고유 요소)
```cpp
struct ScoutingData {
    string enemyTeamName;
    vector<MechType> preferredComposition;
    float winRate;
    vector<string> weaknesses;
    PilotData corePilot;
};
```

#### 밴 단계
```cpp
enum class BanPhase {
    FIRST_BAN_A,   // A팀 1밴
    FIRST_BAN_B,   // B팀 1밴  
    SECOND_BAN_B,  // B팀 2밴
    SECOND_BAN_A   // A팀 2밴
};
```

#### 픽 단계 (스네이크 드래프트)
```cpp
enum class PickPhase {
    PICK_1_A,      // A팀 1픽
    PICK_1_B,      // B팀 1픽
    PICK_2_B,      // B팀 2픽
    PICK_2_A,      // A팀 2픽
    PICK_3_A,      // A팀 3픽
    PICK_3_B       // B팀 3픽 (마지막)
};
```

### 2. 특성 시스템 확장

#### TFM 스타일 특성 적용
```cpp
enum class PilotTrait {
    // 전투 성향 (TFM 참고)
    AGGRESSIVE,     // 폭주형 - 적극적 교전
    CAUTIOUS,       // 신중형 - 안전 우선
    ANALYTICAL,     // 분석형 - 정보 수집 후 행동
    COOPERATIVE,    // 협력형 - 팀플레이 중시
    
    // TMA 고유 특성
    KNIGHT_BORN,    // 나이트 출신
    RIVER_BLOOD,    // 리버 혈통  
    ARBITER_MIND,   // 아비터 사고방식
    
    // 희귀 특성
    ACE_PILOT,      // 에이스 - 모든 능력 보너스
    GENIUS,         // 천재 - 빠른 학습
    VETERAN,        // 베테랑 - 경험 보정
    ROOKIE          // 신인 - 성장 잠재력
};
```

### 3. 메타 변화 시스템

#### 자동 밸런스 시스템 (TFM 방식 개선)
```cpp
class MetaBalancer {
private:
    struct MechTypeStats {
        float pickRate;
        float winRate; 
        int totalMatches;
    };
    
public:
    void AnalyzeSeasonData();
    void ApplyBalanceChanges();
    void IntroduceNewContent();
    
private:
    bool ShouldNerf(MechType type);  // 승률 > 65%
    bool ShouldBuff(MechType type);  // 승률 < 35% && 픽률 < 15%
};
```

### 4. 통계 시스템 (TFM 스타일)

#### 챔피언/기체 통계
```cpp
struct MechStatistics {
    string mechName;
    float winRate;
    float pickRate;
    float banRate;
    int totalPicks;
    float avgDamage;
    float avgSurvivalTime;
    vector<string> strongAgainst;
    vector<string> weakAgainst;
};
```

#### 플레이어 분석 도구
```cpp
struct PlayerAnalysis {
    string playerName;
    map<MechType, float> mechMastery;
    vector<PilotTrait> traits;
    float overallRating;
    string playStyle;  // "Aggressive", "Defensive", "Balanced"
};
```

---

## 🎯 구현 우선순위

### Phase 1: 기본 밴픽 (TFM 핵심 복제)
1. 기체 타입별 상성 데이터
2. 스네이크 드래프트 UI
3. 기본 통계 수집 시스템

### Phase 2: TMA 고유 요소 추가
1. 사전 정찰 시스템
2. 실시간 로그 분석
3. 고급 특성 시스템

### Phase 3: 메타게임 완성
1. 자동 밸런스 시스템
2. 시즌 진행 관리
3. 리그 승급/강등

---

## 📊 성공 지표 비교

### TFM 기준 (참고)
- 밴픽 단계 이탈률: <5%
- 전투 관찰 완료율: >90%
- 재매치 비율: >60%

### TMA 목표 (차별화)
- 정찰 단계 활용률: >70%
- 로그 재분석 비율: >40%
- 전략 변경 빈도: >3회/시즌

---

## 💡 핵심 설계 원칙

### 1. TFM의 검증된 재미 요소는 유지
- 밴픽의 전략적 깊이
- 관찰 중심 플레이
- 메타 변화의 흥미

### 2. TMA만의 고유 가치 추가
- 실시간 진행의 긴장감
- 로그 해석의 분석적 재미
- AI 개성화를 통한 애착 형성

### 3. 복잡도 관리
- TFM: 단순함 속의 깊이
- TMA: 복잡함 속의 직관성

---

**결론**: TFM의 성공 공식을 기반으로 하되, 실시간 AI 전투라는 TMA의 고유 강점을 살려 차별화된 경험을 제공한다. 