export interface Process {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  color: string;
}

export type AlgorithmType =
  | 'FCFS'
  | 'SJF_NP'
  | 'SRTF'
  | 'RR'
  | 'PRIORITY_NP'
  | 'PRIORITY_P';

export type PriorityRule = 'LOWER_IS_HIGHER' | 'HIGHER_IS_HIGHER';

export interface SchedulerConfig {
  timeQuantum: number;
  priorityRule: PriorityRule;
  enableAging: boolean;
  agingThreshold: number; // Wait duration (ms) in ready queue per priority increase
  agingFactor: number;    // Amount priority changes per threshold interval
  sjfPreemptive?: boolean;
}

export interface GanttSegment {
  processId: string | null; // null for Idle
  processName: string;
  startTime: number;
  endTime: number;
  color: string;
}

export interface ProcessResult {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  finalPriority?: number;
  agingBoostCount?: number;
  color: string;
  startTime: number;
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
  responseTime: number;
}

export interface SimulationMetrics {
  avgTurnaroundTime: number;
  avgWaitingTime: number;
  avgResponseTime: number;
  cpuUtilization: number;
  throughput: number;
  totalTime: number;
  contextSwitches: number;
  idleTime: number;
}

export type ProcessState = 'NOT_ARRIVED' | 'READY' | 'RUNNING' | 'TERMINATED';

export interface ProcessLiveState {
  processId: string;
  name: string;
  color: string;
  state: ProcessState;
  remainingBurst: number;
  waitingTime: number;
  readyQueueDuration: number;
  basePriority: number;
  effectivePriority: number;
  hasAged: boolean;
  hasStarted: boolean;
  responseTime: number | null;
  completionTime: number | null;
}

export interface TimeStepState {
  time: number;
  runningProcessId: string | null;
  readyQueue: string[]; // process IDs
  notArrived: string[];
  terminated: string[];
  pcb: Record<string, ProcessLiveState>;
  eventLog: string;
  explanation: string;
}

export interface AlgorithmSimulationResult {
  algorithm: AlgorithmType;
  title: string;
  description: string;
  isPreemptive: boolean;
  gantt: GanttSegment[];
  processResults: ProcessResult[];
  metrics: SimulationMetrics;
  timelineStates: TimeStepState[];
}

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  timeQuantum?: number;
  priorityRule?: PriorityRule;
  enableAging?: boolean;
  agingThreshold?: number;
  agingFactor?: number;
  processes: Process[];
}
