import { useRef, useCallback, useEffect, useState } from 'react';
import type { AnimationQueueItem, AttackEffect, BattleEvent } from '@shared/domain/types';

interface UseAnimationQueueOptions {
  maxConcurrent?: number;
  defaultDuration?: number;
}

interface AnimationQueueState {
  queue: AnimationQueueItem[];
  activeAnimations: AnimationQueueItem[];
  completedIds: Set<string>;
}

export function useAnimationQueue(options: UseAnimationQueueOptions = {}) {
  const { maxConcurrent = 3, defaultDuration = 1500 } = options;
  
  const [state, setState] = useState<AnimationQueueState>({
    queue: [],
    activeAnimations: [],
    completedIds: new Set()
  });
  
  const [attackEffects, setAttackEffects] = useState<AttackEffect[]>([]);
  const [animatingUnits, setAnimatingUnits] = useState<Set<number>>(new Set());
  const participantsRef = useRef<any[]>([]);
  
  // Update participants reference
  const updateParticipants = useCallback((participants: any[]) => {
    participantsRef.current = participants;
  }, []);
  
  const processNextAnimation = useCallback(() => {
    setState(prevState => {
      if (prevState.queue.length === 0 || prevState.activeAnimations.length >= maxConcurrent) {
        return prevState;
      }
      
      // Sort queue by priority (higher priority first)
      const sortedQueue = [...prevState.queue].sort((a, b) => (b.priority || 0) - (a.priority || 0));
      const nextAnimation = sortedQueue[0];
      
      if (!nextAnimation) return prevState;
      
      // Remove from queue and add to active
      const newQueue = prevState.queue.filter(item => item.id !== nextAnimation.id);
      const newActive = [...prevState.activeAnimations, nextAnimation];
      
      // Process the animation based on the event type
      const event = nextAnimation.event;
      
      switch (event.type) {
        case 'UNIT_ATTACK': {
          const { attackerId, targetId, weaponType } = event.data;
          
          // Find participant positions
          const attacker = participantsRef.current.find(p => p.pilotId === attackerId);
          const target = participantsRef.current.find(p => p.pilotId === targetId);
          
          if (attacker && target) {
            // Create attack effect with actual positions
            const attackEffect: AttackEffect = {
              id: `attack-${event.timestamp}-${attackerId}-${targetId}`,
              from: attacker.position,
              to: target.position,
              startTime: Date.now(),
              type: weaponType === "missile" ? "missile" : 
                    weaponType === "beam" ? "beam" : "laser"
            };
            
            setAttackEffects(prev => [...prev, attackEffect]);
          }
          
          setAnimatingUnits(prev => {
            const newSet = new Set(prev);
            newSet.add(attackerId);
            return newSet;
          });
          break;
        }
          
        case 'UNIT_MOVED': {
          const { unitId } = event.data;
          setAnimatingUnits(prev => {
            const newSet = new Set(prev);
            newSet.add(unitId);
            return newSet;
          });
          break;
        }
          
        case 'UNIT_DAMAGED': {
          const { unitId } = event.data;
          // Could add damage flash effect here
          // For now, just track the unit as animating briefly
          setAnimatingUnits(prev => {
            const newSet = new Set(prev);
            newSet.add(unitId);
            return newSet;
          });
          break;
        }
          
        case 'UNIT_DESTROYED': {
          const { unitId } = event.data;
          // Could add destruction effect here
          console.log(`Unit ${unitId} destroyed animation`);
          break;
        }
        
        case 'UNIT_SKILL_USED': {
          const { unitId } = event.data;
          setAnimatingUnits(prev => {
            const newSet = new Set(prev);
            newSet.add(unitId);
            return newSet;
          });
          break;
        }
      }
      
      // Schedule animation completion
      const duration = nextAnimation.duration || defaultDuration;
      setTimeout(() => {
        setState(innerState => {
          const newActive = innerState.activeAnimations.filter(item => item.id !== nextAnimation.id);
          const newCompleted = new Set(innerState.completedIds);
          newCompleted.add(nextAnimation.id);
          
          // Clean up animation effects
          if (event.type === 'UNIT_ATTACK') {
            const { attackerId, targetId } = event.data;
            setAttackEffects(prev => prev.filter(effect => 
              !effect.id.includes(`${event.timestamp}-${attackerId}-${targetId}`)
            ));
            setAnimatingUnits(prev => {
              const newSet = new Set(prev);
              newSet.delete(attackerId);
              return newSet;
            });
          } else if (event.type === 'UNIT_MOVED' || event.type === 'UNIT_DAMAGED' || event.type === 'UNIT_SKILL_USED') {
            const unitId = 'unitId' in event.data ? event.data.unitId : undefined;
            if (unitId !== undefined) {
              setAnimatingUnits(prev => {
                const newSet = new Set(prev);
                newSet.delete(unitId);
                return newSet;
              });
            }
          }
          
          return {
            ...innerState,
            activeAnimations: newActive,
            completedIds: newCompleted
          };
        });
      }, duration);
      
      return {
        ...prevState,
        queue: newQueue,
        activeAnimations: newActive
      };
    });
  }, [maxConcurrent, defaultDuration]);
  
  // Process queue whenever it changes
  useEffect(() => {
    if (state.queue.length > 0 && state.activeAnimations.length < maxConcurrent) {
      processNextAnimation();
    }
  }, [state.queue.length, state.activeAnimations.length, maxConcurrent, processNextAnimation]);
  
  const addAnimation = useCallback((animation: AnimationQueueItem) => {
    setState(prevState => ({
      ...prevState,
      queue: [...prevState.queue, animation]
    }));
  }, []);
  
  const addAnimations = useCallback((animations: AnimationQueueItem[]) => {
    setState(prevState => ({
      ...prevState,
      queue: [...prevState.queue, ...animations]
    }));
  }, []);
  
  const clearQueue = useCallback(() => {
    setState({
      queue: [],
      activeAnimations: [],
      completedIds: new Set()
    });
    setAttackEffects([]);
    setAnimatingUnits(new Set());
  }, []);
  
  const isAnimationComplete = useCallback((animationId: string) => {
    return state.completedIds.has(animationId);
  }, [state.completedIds]);
  
  // Create animation from event
  const createAnimationFromEvent = useCallback((event: BattleEvent, participants?: any[]): AnimationQueueItem | null => {
    let animationType: AnimationQueueItem['type'] | null = null;
    let priority = 0;
    let duration = defaultDuration;
    
    switch (event.type) {
      case 'UNIT_ATTACK':
        animationType = 'attack';
        priority = 2;
        duration = 1500;
        break;
      case 'UNIT_MOVED':
        animationType = 'move';
        priority = 1;
        duration = 500;
        break;
      case 'UNIT_DAMAGED':
        animationType = 'hit';
        priority = 3;
        duration = 300;
        break;
      case 'UNIT_DESTROYED':
        animationType = 'destroy';
        priority = 4;
        duration = 2000;
        break;
      case 'UNIT_SKILL_USED':
        animationType = 'skill';
        priority = 2;
        duration = 2000;
        break;
      default:
        return null;
    }
    
    if (!animationType) return null;
    
    return {
      id: `${animationType}-${event.timestamp}-${Math.random()}`,
      type: animationType,
      event,
      duration,
      priority
    };
  }, [defaultDuration]);
  
  return {
    // State
    queueLength: state.queue.length,
    activeCount: state.activeAnimations.length,
    attackEffects,
    animatingUnits,
    
    // Actions
    addAnimation,
    addAnimations,
    clearQueue,
    isAnimationComplete,
    createAnimationFromEvent,
    
    // For direct access if needed
    setAttackEffects,
    setAnimatingUnits,
    updateParticipants
  };
} 