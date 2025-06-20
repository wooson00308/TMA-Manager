# 전투 시스템 무한 루프 문제 해결

## 문제 원인
1. `damaged` 상태 유닛이 `activeParticipants`에서 제외됨
2. 한 방에 격파되지 않으면 무한 루프 발생
3. AI가 SCOUT/MOVE만 반복하여 전투 진행 안됨

## 해결 방안
1. `damaged` 상태 제거 - active/destroyed만 사용
2. 치명적 데미지로 확실한 격파 보장
3. AI 공격 확률 대폭 증가