import { PresetScenario } from '../types';

export const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'standard-mix',
    name: 'Standard OS Mix (Galvin Example)',
    description: 'A classic 5-process scenario demonstrating standard scheduling behavior with staggered arrivals and varying burst times.',
    timeQuantum: 2,
    priorityRule: 'LOWER_IS_HIGHER',
    processes: [
      { id: 'P1', name: 'P1', arrivalTime: 0, burstTime: 5, priority: 3, color: '#3B82F6' },
      { id: 'P2', name: 'P2', arrivalTime: 1, burstTime: 3, priority: 1, color: '#10B981' },
      { id: 'P3', name: 'P3', arrivalTime: 2, burstTime: 8, priority: 4, color: '#F59E0B' },
      { id: 'P4', name: 'P4', arrivalTime: 3, burstTime: 6, priority: 2, color: '#8B5CF6' },
      { id: 'P5', name: 'P5', arrivalTime: 4, burstTime: 4, priority: 5, color: '#EC4899' },
    ],
  },
  {
    id: 'convoy-effect',
    name: 'Convoy Effect (FCFS Bottleneck)',
    description: 'A massive CPU-hog process (P1) arrives at t=0, causing subsequent short processes to experience high waiting times in FCFS.',
    timeQuantum: 4,
    priorityRule: 'LOWER_IS_HIGHER',
    processes: [
      { id: 'P1', name: 'P1 (Hog)', arrivalTime: 0, burstTime: 24, priority: 3, color: '#EF4444' },
      { id: 'P2', name: 'P2 (Short)', arrivalTime: 1, burstTime: 3, priority: 2, color: '#10B981' },
      { id: 'P3', name: 'P3 (Short)', arrivalTime: 2, burstTime: 3, priority: 1, color: '#06B6D4' },
      { id: 'P4', name: 'P4 (Short)', arrivalTime: 3, burstTime: 2, priority: 4, color: '#F59E0B' },
    ],
  },
  {
    id: 'srtf-advantage',
    name: 'SRTF Preemption Showcase',
    description: 'Demonstrates how Preemptive Shortest Remaining Time First significantly outperforms Non-Preemptive SJF when short jobs arrive mid-execution.',
    timeQuantum: 2,
    priorityRule: 'LOWER_IS_HIGHER',
    processes: [
      { id: 'P1', name: 'P1', arrivalTime: 0, burstTime: 8, priority: 2, color: '#3B82F6' },
      { id: 'P2', name: 'P2', arrivalTime: 1, burstTime: 4, priority: 1, color: '#10B981' },
      { id: 'P3', name: 'P3', arrivalTime: 2, burstTime: 2, priority: 3, color: '#F59E0B' },
      { id: 'P4', name: 'P4', arrivalTime: 3, burstTime: 1, priority: 4, color: '#8B5CF6' },
      { id: 'P5', name: 'P5', arrivalTime: 4, burstTime: 3, priority: 2, color: '#EC4899' },
    ],
  },
  {
    id: 'priority-preemption',
    name: 'Priority & Starvation Demo',
    description: 'Higher priority processes keep arriving, causing low priority processes to wait or get preempted immediately.',
    timeQuantum: 3,
    priorityRule: 'LOWER_IS_HIGHER',
    processes: [
      { id: 'P1', name: 'P1 (Batch)', arrivalTime: 0, burstTime: 10, priority: 4, color: '#64748B' },
      { id: 'P2', name: 'P2 (Urgent)', arrivalTime: 2, burstTime: 4, priority: 1, color: '#EF4444' },
      { id: 'P3', name: 'P3 (High)', arrivalTime: 4, burstTime: 3, priority: 2, color: '#F97316' },
      { id: 'P4', name: 'P4 (Normal)', arrivalTime: 6, burstTime: 2, priority: 3, color: '#3B82F6' },
    ],
  },
  {
    id: 'rr-quantum-balance',
    name: 'Round Robin Quantum Balance',
    description: 'Processes with similar burst times where time quantum choice directly impacts context switching and response times.',
    timeQuantum: 3,
    priorityRule: 'LOWER_IS_HIGHER',
    processes: [
      { id: 'P1', name: 'P1', arrivalTime: 0, burstTime: 6, priority: 1, color: '#3B82F6' },
      { id: 'P2', name: 'P2', arrivalTime: 0, burstTime: 5, priority: 2, color: '#10B981' },
      { id: 'P3', name: 'P3', arrivalTime: 1, burstTime: 7, priority: 3, color: '#F59E0B' },
      { id: 'P4', name: 'P4', arrivalTime: 2, burstTime: 4, priority: 1, color: '#8B5CF6' },
    ],
  },
  {
    id: 'idle-cpu-gaps',
    name: 'Delayed Arrival / CPU Idle Gaps',
    description: 'Processes arrive with gaps in arrival times, testing scheduler idle state handling and CPU utilization math.',
    timeQuantum: 2,
    priorityRule: 'LOWER_IS_HIGHER',
    processes: [
      { id: 'P1', name: 'P1', arrivalTime: 0, burstTime: 3, priority: 2, color: '#3B82F6' },
      { id: 'P2', name: 'P2', arrivalTime: 6, burstTime: 4, priority: 1, color: '#10B981' },
      { id: 'P3', name: 'P3', arrivalTime: 14, burstTime: 5, priority: 3, color: '#F59E0B' },
      { id: 'P4', name: 'P4', arrivalTime: 16, burstTime: 2, priority: 1, color: '#8B5CF6' },
    ],
  },
];
