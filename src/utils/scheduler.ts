import {
  AlgorithmType,
  GanttSegment,
  Process,
  ProcessLiveState,
  ProcessResult,
  SchedulerConfig,
  SimulationMetrics,
  TimeStepState,
  AlgorithmSimulationResult,
} from '../types';

export function runSimulation(
  processes: Process[],
  algorithm: AlgorithmType,
  config: SchedulerConfig
): AlgorithmSimulationResult {
  if (!processes || processes.length === 0) {
    return createEmptyResult(algorithm);
  }

  // Deep clone processes to prevent mutating inputs
  const rawList = processes.map((p) => ({ ...p }));

  switch (algorithm) {
    case 'FCFS':
      return simulateFCFS(rawList);
    case 'SJF_NP':
      return simulateSJF_NP(rawList);
    case 'SRTF':
      return simulateSRTF(rawList);
    case 'RR':
      return simulateRR(rawList, config.timeQuantum || 2);
    case 'PRIORITY_NP':
      return simulatePriority_NP(rawList, config);
    case 'PRIORITY_P':
      return simulatePriority_P(rawList, config);
    default:
      return simulateFCFS(rawList);
  }
}

function createEmptyResult(algorithm: AlgorithmType): AlgorithmSimulationResult {
  return {
    algorithm,
    title: getAlgorithmTitle(algorithm),
    description: getAlgorithmDescription(algorithm),
    isPreemptive: isAlgorithmPreemptive(algorithm),
    gantt: [],
    processResults: [],
    metrics: {
      avgTurnaroundTime: 0,
      avgWaitingTime: 0,
      avgResponseTime: 0,
      cpuUtilization: 0,
      throughput: 0,
      totalTime: 0,
      contextSwitches: 0,
      idleTime: 0,
    },
    timelineStates: [],
  };
}

export function getAlgorithmTitle(algo: AlgorithmType): string {
  switch (algo) {
    case 'FCFS':
      return 'First-Come, First-Served (FCFS)';
    case 'SJF_NP':
      return 'Shortest Job First (Non-Preemptive SJF)';
    case 'SRTF':
      return 'Shortest Remaining Time First (Preemptive SJF / SRTF)';
    case 'RR':
      return 'Round Robin (RR)';
    case 'PRIORITY_NP':
      return 'Priority Scheduling (Non-Preemptive)';
    case 'PRIORITY_P':
      return 'Priority Scheduling (Preemptive)';
  }
}

export function getAlgorithmDescription(algo: AlgorithmType): string {
  switch (algo) {
    case 'FCFS':
      return 'Processes are dispatched in the exact order of their arrival. Simple and fair, but susceptible to the Convoy Effect.';
    case 'SJF_NP':
      return 'Dispatches the process with the smallest total burst time among arrived jobs. Non-preemptive: once a job starts, it runs to completion.';
    case 'SRTF':
      return 'Preemptive variation of SJF. If a newly arrived process has a burst time shorter than the remaining burst time of the currently executing process, the CPU is preempted immediately.';
    case 'RR':
      return 'Each process receives a fixed slice of CPU time (Time Quantum) in circular order. Highly responsive for time-sharing systems.';
    case 'PRIORITY_NP':
      return 'Dispatches the highest priority process from the ready queue. With Aging enabled, processes waiting for long periods gradually gain higher priority to prevent starvation.';
    case 'PRIORITY_P':
      return 'Preemptive priority scheduling. If a process with higher priority arrives (or an existing process ages to a higher priority), the executing process is preempted immediately.';
  }
}

export function isAlgorithmPreemptive(algo: AlgorithmType): boolean {
  return algo === 'SRTF' || algo === 'RR' || algo === 'PRIORITY_P';
}

// ----------------------------------------------------
// Helper: Calculate effective priority with Aging
// ----------------------------------------------------
function calculateEffectivePriority(
  basePriority: number,
  readyQueueDuration: number,
  config: SchedulerConfig
): { effectivePriority: number; boost: number } {
  if (!config.enableAging || config.agingThreshold <= 0 || config.agingFactor <= 0) {
    return { effectivePriority: basePriority, boost: 0 };
  }

  const intervals = Math.floor(readyQueueDuration / config.agingThreshold);
  const boost = intervals * config.agingFactor;

  if (config.priorityRule === 'LOWER_IS_HIGHER') {
    // 1 is top priority -> lower number means higher priority
    const effectivePriority = Math.max(1, basePriority - boost);
    return { effectivePriority, boost };
  } else {
    // Higher number means higher priority
    const effectivePriority = basePriority + boost;
    return { effectivePriority, boost };
  }
}

// Helper: Compare priority between two processes based on rule and effective priorities
function compareEffectivePriority(
  pA: { id: string; arrivalTime: number; effectivePriority: number },
  pB: { id: string; arrivalTime: number; effectivePriority: number },
  rule: 'LOWER_IS_HIGHER' | 'HIGHER_IS_HIGHER'
): number {
  if (rule === 'LOWER_IS_HIGHER') {
    if (pA.effectivePriority !== pB.effectivePriority) {
      return pA.effectivePriority - pB.effectivePriority; // smaller number first
    }
  } else {
    if (pA.effectivePriority !== pB.effectivePriority) {
      return pB.effectivePriority - pA.effectivePriority; // larger number first
    }
  }
  if (pA.arrivalTime !== pB.arrivalTime) return pA.arrivalTime - pB.arrivalTime;
  return pA.id.localeCompare(pB.id);
}

// ----------------------------------------------------
// 1. FCFS (First-Come, First-Served)
// ----------------------------------------------------
function simulateFCFS(processes: Process[]): AlgorithmSimulationResult {
  const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));
  const processMap = new Map<string, Process>(processes.map((p) => [p.id, p]));

  let currentTime = 0;
  const gantt: GanttSegment[] = [];
  const startTimes: Record<string, number> = {};
  const completionTimes: Record<string, number> = {};

  const timelineStates: TimeStepState[] = [];
  const remaining = new Map<string, number>(processes.map((p) => [p.id, p.burstTime]));
  const waitingAcc = new Map<string, number>(processes.map((p) => [p.id, 0]));
  const readyQueueDur = new Map<string, number>(processes.map((p) => [p.id, 0]));
  const firstScheduled = new Map<string, number>();

  let pIndex = 0;
  let runningProcess: Process | null = null;
  const readyQueue: string[] = [];
  const terminated: string[] = [];

  const minArrival = Math.min(...processes.map((p) => p.arrivalTime), 0);
  currentTime = minArrival;

  while (terminated.length < processes.length) {
    // Check arrivals at currentTime
    while (pIndex < sorted.length && sorted[pIndex].arrivalTime <= currentTime) {
      const arrivedP = sorted[pIndex];
      if (!readyQueue.includes(arrivedP.id) && (!runningProcess || runningProcess.id !== arrivedP.id) && !terminated.includes(arrivedP.id)) {
        readyQueue.push(arrivedP.id);
      }
      pIndex++;
    }

    // If CPU is idle, dispatch next ready
    if (!runningProcess && readyQueue.length > 0) {
      const nextId = readyQueue.shift()!;
      runningProcess = processMap.get(nextId)!;
      if (!firstScheduled.has(runningProcess.id)) {
        firstScheduled.set(runningProcess.id, currentTime);
        startTimes[runningProcess.id] = currentTime;
      }
    }

    // Build timeline snapshot
    const notArrived = processes
      .filter((p) => p.arrivalTime > currentTime)
      .map((p) => p.id);

    const pcbSnapshot: Record<string, ProcessLiveState> = {};
    for (const p of processes) {
      let state: ProcessLiveState['state'] = 'NOT_ARRIVED';
      if (terminated.includes(p.id)) state = 'TERMINATED';
      else if (runningProcess && runningProcess.id === p.id) state = 'RUNNING';
      else if (readyQueue.includes(p.id)) state = 'READY';

      pcbSnapshot[p.id] = {
        processId: p.id,
        name: p.name,
        color: p.color,
        state,
        remainingBurst: remaining.get(p.id) ?? 0,
        waitingTime: waitingAcc.get(p.id) ?? 0,
        readyQueueDuration: readyQueueDur.get(p.id) ?? 0,
        basePriority: p.priority,
        effectivePriority: p.priority,
        hasAged: false,
        hasStarted: firstScheduled.has(p.id),
        responseTime: firstScheduled.has(p.id) ? firstScheduled.get(p.id)! - p.arrivalTime : null,
        completionTime: completionTimes[p.id] ?? null,
      };
    }

    let eventLog = 'CPU is IDLE';
    let explanation = `Time ${currentTime}: No ready processes available. Waiting for next arrival.`;
    if (runningProcess) {
      eventLog = `Executing ${runningProcess.name} (rem: ${remaining.get(runningProcess.id)}ms)`;
      explanation = `Time ${currentTime}: ${runningProcess.name} running in FCFS arrival sequence.`;
    }

    timelineStates.push({
      time: currentTime,
      runningProcessId: runningProcess ? runningProcess.id : null,
      readyQueue: [...readyQueue],
      notArrived,
      terminated: [...terminated],
      pcb: pcbSnapshot,
      eventLog,
      explanation,
    });

    // Advance 1 unit of time
    if (runningProcess) {
      addOrExtendGantt(gantt, runningProcess.id, runningProcess.name, currentTime, currentTime + 1, runningProcess.color);

      const rem = (remaining.get(runningProcess.id) ?? 0) - 1;
      remaining.set(runningProcess.id, rem);

      for (const qId of readyQueue) {
        waitingAcc.set(qId, (waitingAcc.get(qId) ?? 0) + 1);
        readyQueueDur.set(qId, (readyQueueDur.get(qId) ?? 0) + 1);
      }

      if (rem <= 0) {
        completionTimes[runningProcess.id] = currentTime + 1;
        terminated.push(runningProcess.id);
        runningProcess = null;
      }
    } else {
      addOrExtendGantt(gantt, null, 'IDLE', currentTime, currentTime + 1, '#94A3B8');
    }

    currentTime++;
  }

  timelineStates.push(createTerminalSnapshot(currentTime, processes, firstScheduled, completionTimes, waitingAcc));

  return packageResults('FCFS', processes, gantt, startTimes, completionTimes, timelineStates);
}

// ----------------------------------------------------
// 2. SJF (Non-Preemptive)
// ----------------------------------------------------
function simulateSJF_NP(processes: Process[]): AlgorithmSimulationResult {
  const processMap = new Map<string, Process>(processes.map((p) => [p.id, p]));
  let currentTime = 0;
  const gantt: GanttSegment[] = [];
  const startTimes: Record<string, number> = {};
  const completionTimes: Record<string, number> = {};

  const timelineStates: TimeStepState[] = [];
  const remaining = new Map<string, number>(processes.map((p) => [p.id, p.burstTime]));
  const waitingAcc = new Map<string, number>(processes.map((p) => [p.id, 0]));
  const readyQueueDur = new Map<string, number>(processes.map((p) => [p.id, 0]));
  const firstScheduled = new Map<string, number>();

  let runningProcess: Process | null = null;
  const readyQueue: string[] = [];
  const terminated: string[] = [];

  const minArrival = Math.min(...processes.map((p) => p.arrivalTime), 0);
  currentTime = minArrival;

  while (terminated.length < processes.length) {
    // Check arrivals
    for (const p of processes) {
      if (p.arrivalTime <= currentTime && !readyQueue.includes(p.id) && (!runningProcess || runningProcess.id !== p.id) && !terminated.includes(p.id)) {
        readyQueue.push(p.id);
      }
    }

    // If CPU is free, sort readyQueue by burstTime (Shortest Job First), tie-break arrival, id
    if (!runningProcess && readyQueue.length > 0) {
      readyQueue.sort((a, b) => {
        const pa = processMap.get(a)!;
        const pb = processMap.get(b)!;
        if (pa.burstTime !== pb.burstTime) return pa.burstTime - pb.burstTime;
        if (pa.arrivalTime !== pb.arrivalTime) return pa.arrivalTime - pb.arrivalTime;
        return pa.id.localeCompare(pb.id);
      });

      const nextId = readyQueue.shift()!;
      runningProcess = processMap.get(nextId)!;
      if (!firstScheduled.has(runningProcess.id)) {
        firstScheduled.set(runningProcess.id, currentTime);
        startTimes[runningProcess.id] = currentTime;
      }
    }

    // Snapshot
    const notArrived = processes.filter((p) => p.arrivalTime > currentTime).map((p) => p.id);
    const pcbSnapshot: Record<string, ProcessLiveState> = {};
    for (const p of processes) {
      let state: ProcessLiveState['state'] = 'NOT_ARRIVED';
      if (terminated.includes(p.id)) state = 'TERMINATED';
      else if (runningProcess && runningProcess.id === p.id) state = 'RUNNING';
      else if (readyQueue.includes(p.id)) state = 'READY';

      pcbSnapshot[p.id] = {
        processId: p.id,
        name: p.name,
        color: p.color,
        state,
        remainingBurst: remaining.get(p.id) ?? 0,
        waitingTime: waitingAcc.get(p.id) ?? 0,
        readyQueueDuration: readyQueueDur.get(p.id) ?? 0,
        basePriority: p.priority,
        effectivePriority: p.priority,
        hasAged: false,
        hasStarted: firstScheduled.has(p.id),
        responseTime: firstScheduled.has(p.id) ? firstScheduled.get(p.id)! - p.arrivalTime : null,
        completionTime: completionTimes[p.id] ?? null,
      };
    }

    let eventLog = 'CPU is IDLE';
    let explanation = `Time ${currentTime}: CPU idle, waiting for process arrivals.`;
    if (runningProcess) {
      eventLog = `Executing ${runningProcess.name} (Burst: ${runningProcess.burstTime}ms, rem: ${remaining.get(runningProcess.id)}ms)`;
      explanation = `Time ${currentTime}: ${runningProcess.name} running (Shortest burst in ready pool: ${runningProcess.burstTime}ms). Non-preemptive mode.`;
    }

    timelineStates.push({
      time: currentTime,
      runningProcessId: runningProcess ? runningProcess.id : null,
      readyQueue: [...readyQueue],
      notArrived,
      terminated: [...terminated],
      pcb: pcbSnapshot,
      eventLog,
      explanation,
    });

    if (runningProcess) {
      addOrExtendGantt(gantt, runningProcess.id, runningProcess.name, currentTime, currentTime + 1, runningProcess.color);
      const rem = (remaining.get(runningProcess.id) ?? 0) - 1;
      remaining.set(runningProcess.id, rem);

      for (const qId of readyQueue) {
        waitingAcc.set(qId, (waitingAcc.get(qId) ?? 0) + 1);
        readyQueueDur.set(qId, (readyQueueDur.get(qId) ?? 0) + 1);
      }

      if (rem <= 0) {
        completionTimes[runningProcess.id] = currentTime + 1;
        terminated.push(runningProcess.id);
        runningProcess = null;
      }
    } else {
      addOrExtendGantt(gantt, null, 'IDLE', currentTime, currentTime + 1, '#94A3B8');
    }

    currentTime++;
  }

  timelineStates.push(createTerminalSnapshot(currentTime, processes, firstScheduled, completionTimes, waitingAcc));

  return packageResults('SJF_NP', processes, gantt, startTimes, completionTimes, timelineStates);
}

// ----------------------------------------------------
// 3. SRTF (Shortest Remaining Time First - Preemptive SJF)
// ----------------------------------------------------
function simulateSRTF(processes: Process[]): AlgorithmSimulationResult {
  const processMap = new Map<string, Process>(processes.map((p) => [p.id, p]));
  let currentTime = 0;
  const gantt: GanttSegment[] = [];
  const startTimes: Record<string, number> = {};
  const completionTimes: Record<string, number> = {};

  const timelineStates: TimeStepState[] = [];
  const remaining = new Map<string, number>(processes.map((p) => [p.id, p.burstTime]));
  const waitingAcc = new Map<string, number>(processes.map((p) => [p.id, 0]));
  const readyQueueDur = new Map<string, number>(processes.map((p) => [p.id, 0]));
  const firstScheduled = new Map<string, number>();

  let runningProcessId: string | null = null;
  const readyPool: string[] = [];
  const terminated: string[] = [];

  const minArrival = Math.min(...processes.map((p) => p.arrivalTime), 0);
  currentTime = minArrival;

  while (terminated.length < processes.length) {
    // Add all newly arrived processes into ready pool
    for (const p of processes) {
      if (p.arrivalTime <= currentTime && !terminated.includes(p.id) && !readyPool.includes(p.id) && runningProcessId !== p.id) {
        readyPool.push(p.id);
      }
    }

    // Preemption check: Pool all available candidates (including running process if any)
    const candidates: string[] = [...readyPool];
    if (runningProcessId !== null && (remaining.get(runningProcessId) ?? 0) > 0) {
      candidates.push(runningProcessId);
    }

    let preemptionOccurred = false;
    let preemptedProcessName: string | null = null;

    if (candidates.length > 0) {
      // Pick process with minimum remaining burst time (tie-break arrival, ID)
      candidates.sort((a, b) => {
        const remA = remaining.get(a)!;
        const remB = remaining.get(b)!;
        if (remA !== remB) return remA - remB;
        const pa = processMap.get(a)!;
        const pb = processMap.get(b)!;
        if (pa.arrivalTime !== pb.arrivalTime) return pa.arrivalTime - pb.arrivalTime;
        return pa.id.localeCompare(pb.id);
      });

      const selectedId = candidates[0];
      if (runningProcessId && runningProcessId !== selectedId) {
        // Preemption! A process with shorter remaining burst arrived
        const prevRunningObj = processMap.get(runningProcessId)!;
        preemptedProcessName = prevRunningObj.name;
        readyPool.push(runningProcessId);
        preemptionOccurred = true;
      }

      runningProcessId = selectedId;
      // Remove chosen from ready pool
      const idx = readyPool.indexOf(selectedId);
      if (idx !== -1) readyPool.splice(idx, 1);

      if (!firstScheduled.has(runningProcessId)) {
        firstScheduled.set(runningProcessId, currentTime);
        startTimes[runningProcessId] = currentTime;
      }
    } else {
      runningProcessId = null;
    }

    // Snapshot
    const notArrived = processes.filter((p) => p.arrivalTime > currentTime).map((p) => p.id);
    const pcbSnapshot: Record<string, ProcessLiveState> = {};
    for (const p of processes) {
      let state: ProcessLiveState['state'] = 'NOT_ARRIVED';
      if (terminated.includes(p.id)) state = 'TERMINATED';
      else if (runningProcessId === p.id) state = 'RUNNING';
      else if (readyPool.includes(p.id)) state = 'READY';

      pcbSnapshot[p.id] = {
        processId: p.id,
        name: p.name,
        color: p.color,
        state,
        remainingBurst: remaining.get(p.id) ?? 0,
        waitingTime: waitingAcc.get(p.id) ?? 0,
        readyQueueDuration: readyQueueDur.get(p.id) ?? 0,
        basePriority: p.priority,
        effectivePriority: p.priority,
        hasAged: false,
        hasStarted: firstScheduled.has(p.id),
        responseTime: firstScheduled.has(p.id) ? firstScheduled.get(p.id)! - p.arrivalTime : null,
        completionTime: completionTimes[p.id] ?? null,
      };
    }

    let eventLog = 'CPU is IDLE';
    let explanation = `Time ${currentTime}: No jobs currently available.`;
    if (runningProcessId) {
      const pObj = processMap.get(runningProcessId)!;
      const rem = remaining.get(runningProcessId)!;
      if (preemptionOccurred) {
        eventLog = `⚡ Preemption: ${pObj.name} preempted ${preemptedProcessName} (Shorter remaining burst: ${rem}ms)`;
        explanation = `Time ${currentTime}: ${pObj.name} arrived with shorter remaining burst (${rem}ms) than ${preemptedProcessName}, preempting CPU.`;
      } else {
        eventLog = `Running ${pObj.name} (rem: ${rem}ms)`;
        explanation = `Time ${currentTime}: ${pObj.name} has the shortest remaining burst (${rem}ms) among all ready processes.`;
      }
    }

    timelineStates.push({
      time: currentTime,
      runningProcessId,
      readyQueue: [...readyPool],
      notArrived,
      terminated: [...terminated],
      pcb: pcbSnapshot,
      eventLog,
      explanation,
    });

    if (runningProcessId) {
      const pObj = processMap.get(runningProcessId)!;
      addOrExtendGantt(gantt, pObj.id, pObj.name, currentTime, currentTime + 1, pObj.color);
      const rem = remaining.get(runningProcessId)! - 1;
      remaining.set(runningProcessId, rem);

      for (const qId of readyPool) {
        waitingAcc.set(qId, (waitingAcc.get(qId) ?? 0) + 1);
        readyQueueDur.set(qId, (readyQueueDur.get(qId) ?? 0) + 1);
      }

      if (rem <= 0) {
        completionTimes[runningProcessId] = currentTime + 1;
        terminated.push(runningProcessId);
        runningProcessId = null;
      }
    } else {
      addOrExtendGantt(gantt, null, 'IDLE', currentTime, currentTime + 1, '#94A3B8');
    }

    currentTime++;
  }

  timelineStates.push(createTerminalSnapshot(currentTime, processes, firstScheduled, completionTimes, waitingAcc));

  return packageResults('SRTF', processes, gantt, startTimes, completionTimes, timelineStates);
}

// ----------------------------------------------------
// 4. Round Robin (RR)
// ----------------------------------------------------
function simulateRR(processes: Process[], timeQuantum: number): AlgorithmSimulationResult {
  const q = Math.max(1, timeQuantum);
  const processMap = new Map<string, Process>(processes.map((p) => [p.id, p]));
  const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));

  let currentTime = 0;
  const gantt: GanttSegment[] = [];
  const startTimes: Record<string, number> = {};
  const completionTimes: Record<string, number> = {};

  const timelineStates: TimeStepState[] = [];
  const remaining = new Map<string, number>(processes.map((p) => [p.id, p.burstTime]));
  const waitingAcc = new Map<string, number>(processes.map((p) => [p.id, 0]));
  const readyQueueDur = new Map<string, number>(processes.map((p) => [p.id, 0]));
  const firstScheduled = new Map<string, number>();

  let runningProcessId: string | null = null;
  let currentSliceUsed = 0;
  const readyQueue: string[] = [];
  const terminated: string[] = [];
  let arrivalIndex = 0;

  const minArrival = Math.min(...processes.map((p) => p.arrivalTime), 0);
  currentTime = minArrival;

  while (terminated.length < processes.length) {
    // 1. Check newly arrived processes at exact current time
    while (arrivalIndex < sorted.length && sorted[arrivalIndex].arrivalTime <= currentTime) {
      const arrP = sorted[arrivalIndex];
      if (!readyQueue.includes(arrP.id) && runningProcessId !== arrP.id && !terminated.includes(arrP.id)) {
        readyQueue.push(arrP.id);
      }
      arrivalIndex++;
    }

    // 2. If quantum expired on running process and it has remaining burst, requeue it
    if (runningProcessId && currentSliceUsed >= q) {
      if ((remaining.get(runningProcessId) ?? 0) > 0) {
        readyQueue.push(runningProcessId);
      }
      runningProcessId = null;
      currentSliceUsed = 0;
    }

    // 3. If CPU is free, pick next from FIFO readyQueue
    if (!runningProcessId && readyQueue.length > 0) {
      runningProcessId = readyQueue.shift()!;
      currentSliceUsed = 0;
      if (!firstScheduled.has(runningProcessId)) {
        firstScheduled.set(runningProcessId, currentTime);
        startTimes[runningProcessId] = currentTime;
      }
    }

    // Snapshot
    const notArrived = processes.filter((p) => p.arrivalTime > currentTime).map((p) => p.id);
    const pcbSnapshot: Record<string, ProcessLiveState> = {};
    for (const p of processes) {
      let state: ProcessLiveState['state'] = 'NOT_ARRIVED';
      if (terminated.includes(p.id)) state = 'TERMINATED';
      else if (runningProcessId === p.id) state = 'RUNNING';
      else if (readyQueue.includes(p.id)) state = 'READY';

      pcbSnapshot[p.id] = {
        processId: p.id,
        name: p.name,
        color: p.color,
        state,
        remainingBurst: remaining.get(p.id) ?? 0,
        waitingTime: waitingAcc.get(p.id) ?? 0,
        readyQueueDuration: readyQueueDur.get(p.id) ?? 0,
        basePriority: p.priority,
        effectivePriority: p.priority,
        hasAged: false,
        hasStarted: firstScheduled.has(p.id),
        responseTime: firstScheduled.has(p.id) ? firstScheduled.get(p.id)! - p.arrivalTime : null,
        completionTime: completionTimes[p.id] ?? null,
      };
    }

    let eventLog = 'CPU is IDLE';
    let explanation = `Time ${currentTime}: CPU idle, waiting for ready processes.`;
    if (runningProcessId) {
      const pObj = processMap.get(runningProcessId)!;
      const rem = remaining.get(runningProcessId)!;
      eventLog = `Executing ${pObj.name} (Slice: ${currentSliceUsed + 1}/${q}ms, rem: ${rem}ms)`;
      explanation = `Time ${currentTime}: ${pObj.name} executing in Round Robin time slice (${currentSliceUsed + 1} of ${q}ms quantum).`;
    }

    timelineStates.push({
      time: currentTime,
      runningProcessId,
      readyQueue: [...readyQueue],
      notArrived,
      terminated: [...terminated],
      pcb: pcbSnapshot,
      eventLog,
      explanation,
    });

    // Advance 1 unit
    if (runningProcessId) {
      const pObj = processMap.get(runningProcessId)!;
      addOrExtendGantt(gantt, pObj.id, pObj.name, currentTime, currentTime + 1, pObj.color);
      const rem = remaining.get(runningProcessId)! - 1;
      remaining.set(runningProcessId, rem);
      currentSliceUsed++;

      for (const qId of readyQueue) {
        waitingAcc.set(qId, (waitingAcc.get(qId) ?? 0) + 1);
        readyQueueDur.set(qId, (readyQueueDur.get(qId) ?? 0) + 1);
      }

      if (rem <= 0) {
        completionTimes[runningProcessId] = currentTime + 1;
        terminated.push(runningProcessId);
        runningProcessId = null;
        currentSliceUsed = 0;
      }
    } else {
      addOrExtendGantt(gantt, null, 'IDLE', currentTime, currentTime + 1, '#94A3B8');
    }

    currentTime++;
  }

  timelineStates.push(createTerminalSnapshot(currentTime, processes, firstScheduled, completionTimes, waitingAcc));

  return packageResults('RR', processes, gantt, startTimes, completionTimes, timelineStates);
}

// ----------------------------------------------------
// 5. Priority Scheduling (Non-Preemptive with Aging)
// ----------------------------------------------------
function simulatePriority_NP(processes: Process[], config: SchedulerConfig): AlgorithmSimulationResult {
  const processMap = new Map<string, Process>(processes.map((p) => [p.id, p]));
  let currentTime = 0;
  const gantt: GanttSegment[] = [];
  const startTimes: Record<string, number> = {};
  const completionTimes: Record<string, number> = {};
  const finalPriorities: Record<string, number> = {};
  const agingCounts: Record<string, number> = {};

  const timelineStates: TimeStepState[] = [];
  const remaining = new Map<string, number>(processes.map((p) => [p.id, p.burstTime]));
  const waitingAcc = new Map<string, number>(processes.map((p) => [p.id, 0]));
  const readyQueueDur = new Map<string, number>(processes.map((p) => [p.id, 0]));
  const firstScheduled = new Map<string, number>();

  let runningProcess: Process | null = null;
  const readyQueue: string[] = [];
  const terminated: string[] = [];

  const minArrival = Math.min(...processes.map((p) => p.arrivalTime), 0);
  currentTime = minArrival;

  while (terminated.length < processes.length) {
    // Check arrivals
    for (const p of processes) {
      if (p.arrivalTime <= currentTime && !readyQueue.includes(p.id) && (!runningProcess || runningProcess.id !== p.id) && !terminated.includes(p.id)) {
        readyQueue.push(p.id);
      }
    }

    // Compute effective priorities for ready queue items with Aging
    const effectivePriorityMap = new Map<string, { effectivePriority: number; boost: number }>();
    for (const pId of processes.map((p) => p.id)) {
      const p = processMap.get(pId)!;
      const qDuration = readyQueueDur.get(pId) ?? 0;
      effectivePriorityMap.set(pId, calculateEffectivePriority(p.priority, qDuration, config));
    }

    // If CPU is free, select highest effective priority from readyQueue
    if (!runningProcess && readyQueue.length > 0) {
      readyQueue.sort((a, b) => {
        const pa = processMap.get(a)!;
        const pb = processMap.get(b)!;
        const effA = effectivePriorityMap.get(a)!.effectivePriority;
        const effB = effectivePriorityMap.get(b)!.effectivePriority;
        return compareEffectivePriority(
          { id: pa.id, arrivalTime: pa.arrivalTime, effectivePriority: effA },
          { id: pb.id, arrivalTime: pb.arrivalTime, effectivePriority: effB },
          config.priorityRule
        );
      });

      const nextId = readyQueue.shift()!;
      runningProcess = processMap.get(nextId)!;
      if (!firstScheduled.has(runningProcess.id)) {
        firstScheduled.set(runningProcess.id, currentTime);
        startTimes[runningProcess.id] = currentTime;
      }
    }

    // Build PCB Snapshot
    const notArrived = processes.filter((p) => p.arrivalTime > currentTime).map((p) => p.id);
    const pcbSnapshot: Record<string, ProcessLiveState> = {};
    for (const p of processes) {
      let state: ProcessLiveState['state'] = 'NOT_ARRIVED';
      if (terminated.includes(p.id)) state = 'TERMINATED';
      else if (runningProcess && runningProcess.id === p.id) state = 'RUNNING';
      else if (readyQueue.includes(p.id)) state = 'READY';

      const eff = effectivePriorityMap.get(p.id) ?? { effectivePriority: p.priority, boost: 0 };
      const qDur = readyQueueDur.get(p.id) ?? 0;

      pcbSnapshot[p.id] = {
        processId: p.id,
        name: p.name,
        color: p.color,
        state,
        remainingBurst: remaining.get(p.id) ?? 0,
        waitingTime: waitingAcc.get(p.id) ?? 0,
        readyQueueDuration: qDur,
        basePriority: p.priority,
        effectivePriority: eff.effectivePriority,
        hasAged: eff.boost > 0,
        hasStarted: firstScheduled.has(p.id),
        responseTime: firstScheduled.has(p.id) ? firstScheduled.get(p.id)! - p.arrivalTime : null,
        completionTime: completionTimes[p.id] ?? null,
      };
    }

    let eventLog = 'CPU is IDLE';
    let explanation = `Time ${currentTime}: CPU idle, waiting for processes.`;
    if (runningProcess) {
      const runningEff = effectivePriorityMap.get(runningProcess.id)!;
      const agedTag = runningEff.boost > 0 ? ` (Aged from P:${runningProcess.priority} -> ${runningEff.effectivePriority})` : ` (P: ${runningProcess.priority})`;
      eventLog = `Executing ${runningProcess.name}${agedTag} (rem: ${remaining.get(runningProcess.id)}ms)`;
      explanation = `Time ${currentTime}: ${runningProcess.name} running with effective priority ${runningEff.effectivePriority}.${
        config.enableAging && runningEff.boost > 0 ? ` [Aging Boost active: +${runningEff.boost} priority boost]` : ''
      }`;
    }

    timelineStates.push({
      time: currentTime,
      runningProcessId: runningProcess ? runningProcess.id : null,
      readyQueue: [...readyQueue],
      notArrived,
      terminated: [...terminated],
      pcb: pcbSnapshot,
      eventLog,
      explanation,
    });

    if (runningProcess) {
      addOrExtendGantt(gantt, runningProcess.id, runningProcess.name, currentTime, currentTime + 1, runningProcess.color);
      const rem = (remaining.get(runningProcess.id) ?? 0) - 1;
      remaining.set(runningProcess.id, rem);

      for (const qId of readyQueue) {
        waitingAcc.set(qId, (waitingAcc.get(qId) ?? 0) + 1);
        readyQueueDur.set(qId, (readyQueueDur.get(qId) ?? 0) + 1);
      }

      if (rem <= 0) {
        completionTimes[runningProcess.id] = currentTime + 1;
        const finalEff = effectivePriorityMap.get(runningProcess.id)!;
        finalPriorities[runningProcess.id] = finalEff.effectivePriority;
        agingCounts[runningProcess.id] = finalEff.boost;
        terminated.push(runningProcess.id);
        runningProcess = null;
      }
    } else {
      addOrExtendGantt(gantt, null, 'IDLE', currentTime, currentTime + 1, '#94A3B8');
    }

    currentTime++;
  }

  timelineStates.push(createTerminalSnapshot(currentTime, processes, firstScheduled, completionTimes, waitingAcc));

  return packageResults('PRIORITY_NP', processes, gantt, startTimes, completionTimes, timelineStates, finalPriorities, agingCounts);
}

// ----------------------------------------------------
// 6. Priority Scheduling (Preemptive with Aging)
// ----------------------------------------------------
function simulatePriority_P(processes: Process[], config: SchedulerConfig): AlgorithmSimulationResult {
  const processMap = new Map<string, Process>(processes.map((p) => [p.id, p]));
  let currentTime = 0;
  const gantt: GanttSegment[] = [];
  const startTimes: Record<string, number> = {};
  const completionTimes: Record<string, number> = {};
  const finalPriorities: Record<string, number> = {};
  const agingCounts: Record<string, number> = {};

  const timelineStates: TimeStepState[] = [];
  const remaining = new Map<string, number>(processes.map((p) => [p.id, p.burstTime]));
  const waitingAcc = new Map<string, number>(processes.map((p) => [p.id, 0]));
  const readyQueueDur = new Map<string, number>(processes.map((p) => [p.id, 0]));
  const firstScheduled = new Map<string, number>();

  let runningProcessId: string | null = null;
  const readyPool: string[] = [];
  const terminated: string[] = [];

  const minArrival = Math.min(...processes.map((p) => p.arrivalTime), 0);
  currentTime = minArrival;

  while (terminated.length < processes.length) {
    // Check arrivals
    for (const p of processes) {
      if (p.arrivalTime <= currentTime && !terminated.includes(p.id) && !readyPool.includes(p.id) && runningProcessId !== p.id) {
        readyPool.push(p.id);
      }
    }

    // Calculate effective priority for all candidate processes
    const effectivePriorityMap = new Map<string, { effectivePriority: number; boost: number }>();
    for (const pId of processes.map((p) => p.id)) {
      const p = processMap.get(pId)!;
      const qDuration = readyQueueDur.get(pId) ?? 0;
      effectivePriorityMap.set(pId, calculateEffectivePriority(p.priority, qDuration, config));
    }

    const candidates: string[] = [...readyPool];
    if (runningProcessId !== null && (remaining.get(runningProcessId) ?? 0) > 0) {
      candidates.push(runningProcessId);
    }

    let preemptionOccurred = false;
    let preemptReason = '';

    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        const pa = processMap.get(a)!;
        const pb = processMap.get(b)!;
        const effA = effectivePriorityMap.get(a)!.effectivePriority;
        const effB = effectivePriorityMap.get(b)!.effectivePriority;
        return compareEffectivePriority(
          { id: pa.id, arrivalTime: pa.arrivalTime, effectivePriority: effA },
          { id: pb.id, arrivalTime: pb.arrivalTime, effectivePriority: effB },
          config.priorityRule
        );
      });

      const selectedId = candidates[0];

      if (runningProcessId && runningProcessId !== selectedId) {
        const prevRunningObj = processMap.get(runningProcessId)!;
        const nextObj = processMap.get(selectedId)!;
        const prevEff = effectivePriorityMap.get(runningProcessId)!.effectivePriority;
        const nextEff = effectivePriorityMap.get(selectedId)!.effectivePriority;
        const agedBoost = effectivePriorityMap.get(selectedId)!.boost;

        readyPool.push(runningProcessId);
        preemptionOccurred = true;
        if (config.enableAging && agedBoost > 0) {
          preemptReason = `⚡ Priority Aging Preemption: ${nextObj.name} aged to Priority ${nextEff} (+${agedBoost}), preempting ${prevRunningObj.name} (P: ${prevEff})`;
        } else {
          preemptReason = `⚡ High Priority Preemption: ${nextObj.name} (P: ${nextEff}) arrived & preempted ${prevRunningObj.name} (P: ${prevEff})`;
        }
      }

      runningProcessId = selectedId;
      const idx = readyPool.indexOf(selectedId);
      if (idx !== -1) readyPool.splice(idx, 1);

      if (!firstScheduled.has(runningProcessId)) {
        firstScheduled.set(runningProcessId, currentTime);
        startTimes[runningProcessId] = currentTime;
      }
    } else {
      runningProcessId = null;
    }

    const notArrived = processes.filter((p) => p.arrivalTime > currentTime).map((p) => p.id);
    const pcbSnapshot: Record<string, ProcessLiveState> = {};
    for (const p of processes) {
      let state: ProcessLiveState['state'] = 'NOT_ARRIVED';
      if (terminated.includes(p.id)) state = 'TERMINATED';
      else if (runningProcessId === p.id) state = 'RUNNING';
      else if (readyPool.includes(p.id)) state = 'READY';

      const eff = effectivePriorityMap.get(p.id) ?? { effectivePriority: p.priority, boost: 0 };
      const qDur = readyQueueDur.get(p.id) ?? 0;

      pcbSnapshot[p.id] = {
        processId: p.id,
        name: p.name,
        color: p.color,
        state,
        remainingBurst: remaining.get(p.id) ?? 0,
        waitingTime: waitingAcc.get(p.id) ?? 0,
        readyQueueDuration: qDur,
        basePriority: p.priority,
        effectivePriority: eff.effectivePriority,
        hasAged: eff.boost > 0,
        hasStarted: firstScheduled.has(p.id),
        responseTime: firstScheduled.has(p.id) ? firstScheduled.get(p.id)! - p.arrivalTime : null,
        completionTime: completionTimes[p.id] ?? null,
      };
    }

    let eventLog = 'CPU is IDLE';
    let explanation = `Time ${currentTime}: No ready processes.`;
    if (runningProcessId) {
      const pObj = processMap.get(runningProcessId)!;
      const rem = remaining.get(runningProcessId)!;
      const eff = effectivePriorityMap.get(runningProcessId)!;

      if (preemptionOccurred) {
        eventLog = preemptReason;
        explanation = `Time ${currentTime}: ${pObj.name} holds highest effective priority (${eff.effectivePriority}) and preempts the core.`;
      } else {
        eventLog = `Running ${pObj.name} (Effective P: ${eff.effectivePriority}${eff.boost > 0 ? ` [Aged +${eff.boost}]` : ''}, rem: ${rem}ms)`;
        explanation = `Time ${currentTime}: ${pObj.name} active with priority ${eff.effectivePriority}.`;
      }
    }

    timelineStates.push({
      time: currentTime,
      runningProcessId,
      readyQueue: [...readyPool],
      notArrived,
      terminated: [...terminated],
      pcb: pcbSnapshot,
      eventLog,
      explanation,
    });

    if (runningProcessId) {
      const pObj = processMap.get(runningProcessId)!;
      addOrExtendGantt(gantt, pObj.id, pObj.name, currentTime, currentTime + 1, pObj.color);
      const rem = remaining.get(runningProcessId)! - 1;
      remaining.set(runningProcessId, rem);

      for (const qId of readyPool) {
        waitingAcc.set(qId, (waitingAcc.get(qId) ?? 0) + 1);
        readyQueueDur.set(qId, (readyQueueDur.get(qId) ?? 0) + 1);
      }

      if (rem <= 0) {
        completionTimes[runningProcessId] = currentTime + 1;
        const finalEff = effectivePriorityMap.get(runningProcessId)!;
        finalPriorities[runningProcessId] = finalEff.effectivePriority;
        agingCounts[runningProcessId] = finalEff.boost;
        terminated.push(runningProcessId);
        runningProcessId = null;
      }
    } else {
      addOrExtendGantt(gantt, null, 'IDLE', currentTime, currentTime + 1, '#94A3B8');
    }

    currentTime++;
  }

  timelineStates.push(createTerminalSnapshot(currentTime, processes, firstScheduled, completionTimes, waitingAcc));

  return packageResults('PRIORITY_P', processes, gantt, startTimes, completionTimes, timelineStates, finalPriorities, agingCounts);
}

// ----------------------------------------------------
// Helpers
// ----------------------------------------------------
function addOrExtendGantt(
  gantt: GanttSegment[],
  processId: string | null,
  processName: string,
  startTime: number,
  endTime: number,
  color: string
) {
  if (gantt.length > 0) {
    const last = gantt[gantt.length - 1];
    if (last.processId === processId) {
      last.endTime = endTime;
      return;
    }
  }
  gantt.push({ processId, processName, startTime, endTime, color });
}

function createTerminalSnapshot(
  finalTime: number,
  processes: Process[],
  firstScheduled: Map<string, number>,
  completionTimes: Record<string, number>,
  waitingAcc: Map<string, number>
): TimeStepState {
  const pcbSnapshot: Record<string, ProcessLiveState> = {};
  for (const p of processes) {
    pcbSnapshot[p.id] = {
      processId: p.id,
      name: p.name,
      color: p.color,
      state: 'TERMINATED',
      remainingBurst: 0,
      waitingTime: waitingAcc.get(p.id) ?? 0,
      readyQueueDuration: 0,
      basePriority: p.priority,
      effectivePriority: p.priority,
      hasAged: false,
      hasStarted: true,
      responseTime: firstScheduled.has(p.id) ? firstScheduled.get(p.id)! - p.arrivalTime : 0,
      completionTime: completionTimes[p.id] ?? finalTime,
    };
  }

  return {
    time: finalTime,
    runningProcessId: null,
    readyQueue: [],
    notArrived: [],
    terminated: processes.map((p) => p.id),
    pcb: pcbSnapshot,
    eventLog: 'All processes have completed execution.',
    explanation: `Time ${finalTime}: Scheduling simulation finished. All ${processes.length} processes terminated.`,
  };
}

function packageResults(
  algo: AlgorithmType,
  processes: Process[],
  gantt: GanttSegment[],
  startTimes: Record<string, number>,
  completionTimes: Record<string, number>,
  timelineStates: TimeStepState[],
  finalPriorities?: Record<string, number>,
  agingCounts?: Record<string, number>
): AlgorithmSimulationResult {
  const processResults: ProcessResult[] = processes.map((p) => {
    const ct = completionTimes[p.id] ?? 0;
    const tat = ct - p.arrivalTime;
    const wt = tat - p.burstTime;
    const st = startTimes[p.id] ?? p.arrivalTime;
    const rt = st - p.arrivalTime;

    return {
      id: p.id,
      name: p.name,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority,
      finalPriority: finalPriorities ? finalPriorities[p.id] ?? p.priority : p.priority,
      agingBoostCount: agingCounts ? agingCounts[p.id] ?? 0 : 0,
      color: p.color,
      startTime: st,
      completionTime: ct,
      turnaroundTime: Math.max(0, tat),
      waitingTime: Math.max(0, wt),
      responseTime: Math.max(0, rt),
    };
  });

  const totalProcesses = processResults.length;
  const totalTAT = processResults.reduce((sum, r) => sum + r.turnaroundTime, 0);
  const totalWT = processResults.reduce((sum, r) => sum + r.waitingTime, 0);
  const totalRT = processResults.reduce((sum, r) => sum + r.responseTime, 0);

  const totalTime = gantt.length > 0 ? gantt[gantt.length - 1].endTime : 0;
  const idleTime = gantt
    .filter((g) => g.processId === null)
    .reduce((sum, g) => sum + (g.endTime - g.startTime), 0);
  const busyTime = totalTime - idleTime;

  // Context switches: number of switches between different processes (excluding initial start)
  let contextSwitches = 0;
  for (let i = 1; i < gantt.length; i++) {
    if (gantt[i].processId !== gantt[i - 1].processId) {
      contextSwitches++;
    }
  }

  const metrics: SimulationMetrics = {
    avgTurnaroundTime: totalProcesses > 0 ? Number((totalTAT / totalProcesses).toFixed(2)) : 0,
    avgWaitingTime: totalProcesses > 0 ? Number((totalWT / totalProcesses).toFixed(2)) : 0,
    avgResponseTime: totalProcesses > 0 ? Number((totalRT / totalProcesses).toFixed(2)) : 0,
    cpuUtilization: totalTime > 0 ? Number(((busyTime / totalTime) * 100).toFixed(1)) : 0,
    throughput: totalTime > 0 ? Number((totalProcesses / totalTime).toFixed(3)) : 0,
    totalTime,
    contextSwitches,
    idleTime,
  };

  return {
    algorithm: algo,
    title: getAlgorithmTitle(algo),
    description: getAlgorithmDescription(algo),
    isPreemptive: isAlgorithmPreemptive(algo),
    gantt,
    processResults,
    metrics,
    timelineStates,
  };
}

