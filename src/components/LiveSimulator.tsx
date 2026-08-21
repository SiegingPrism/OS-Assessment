import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  FastForward,
  Cpu,
  Layers,
  CheckCircle2,
  Hourglass,
  Activity,
  Zap,
  Gauge,
  Clock,
  Terminal,
} from 'lucide-react';
import { AlgorithmSimulationResult, Process } from '../types';
import { GanttChart } from './GanttChart';

interface LiveSimulatorProps {
  simulation: AlgorithmSimulationResult;
  processes: Process[];
}

export const LiveSimulator: React.FC<LiveSimulatorProps> = ({
  simulation,
  processes,
}) => {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const timerRef = useRef<number | null>(null);

  const totalTime = simulation.metrics.totalTime;

  // Reset time if simulation changes
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [simulation]);

  // Animation Loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(150, 700 / speed);
      timerRef.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalTime) {
            setIsPlaying(false);
            return totalTime;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, totalTime]);

  const handlePlayPause = () => {
    if (currentTime >= totalTime) {
      setCurrentTime(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleStep = () => {
    if (currentTime < totalTime) {
      setCurrentTime((t) => t + 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Get current snapshot state
  const timeStep =
    simulation.timelineStates.find((s) => s.time === currentTime) ||
    simulation.timelineStates[simulation.timelineStates.length - 1] ||
    simulation.timelineStates[0];

  const runningProcess = timeStep?.runningProcessId
    ? processes.find((p) => p.id === timeStep.runningProcessId)
    : null;

  const runningPcb = timeStep?.runningProcessId
    ? timeStep.pcb[timeStep.runningProcessId]
    : null;

  const readyProcesses = timeStep
    ? timeStep.readyQueue
        .map((id) => ({
          process: processes.find((p) => p.id === id),
          live: timeStep.pcb[id],
        }))
        .filter((item) => item.process !== undefined)
    : [];

  const unarrivedProcesses = timeStep
    ? timeStep.notArrived
        .map((id) => processes.find((p) => p.id === id))
        .filter((p): p is Process => p !== undefined)
    : [];

  const terminatedProcesses = timeStep
    ? timeStep.terminated
        .map((id) => ({
          process: processes.find((p) => p.id === id),
          result: simulation.processResults.find((r) => r.id === id),
        }))
        .filter((item) => item.process !== undefined)
    : [];

  return (
    <div className="space-y-6">
      {/* Playback Transport Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Main Controls */}
          <div className="flex items-center gap-2">
            <button
              id="btn-play-pause"
              onClick={handlePlayPause}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-sm ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                  : currentTime >= totalTime
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : currentTime >= totalTime ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Replay</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Simulation</span>
                </>
              )}
            </button>

            <button
              id="btn-step-forward"
              onClick={handleStep}
              disabled={isPlaying || currentTime >= totalTime}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 rounded-xl border border-slate-200 transition flex items-center gap-1.5 text-xs px-3 font-semibold shadow-2xs"
              title="Step 1 ms Forward"
            >
              <SkipForward className="w-4 h-4 text-blue-600" />
              <span>Step</span>
            </button>

            <button
              id="btn-reset-simulation"
              onClick={handleReset}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-amber-600 rounded-xl border border-slate-200 transition flex items-center gap-1.5 text-xs px-3 font-semibold shadow-2xs"
              title="Reset timeline to 0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>

          {/* Time Scrubber */}
          <div className="flex-1 w-full max-w-md flex items-center gap-3">
            <div className="text-xs font-mono font-bold text-slate-700 w-20 text-right">
              <span className="text-blue-600 text-sm">{currentTime}</span> / {totalTime} ms
            </div>
            <input
              id="time-scrubber-slider"
              type="range"
              min="0"
              max={totalTime || 1}
              value={currentTime}
              onChange={(e) => setCurrentTime(parseInt(e.target.value, 10))}
              className="flex-1 h-2 bg-slate-200 accent-blue-600 rounded-lg cursor-pointer"
            />
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <FastForward className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs text-slate-500 font-semibold">Speed:</span>
            {[0.5, 1, 2, 4].map((spd) => (
              <button
                key={spd}
                id={`btn-speed-${spd}x`}
                onClick={() => setSpeed(spd)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition ${
                  speed === spd
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* State Machine Execution Pipeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Execution State Pipeline (t = {currentTime} ms)
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-sans">
            {runningProcess ? (
              <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                Core Active: {runningProcess.name}
              </span>
            ) : (
              <span className="px-3 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold text-[11px]">
                CPU Idle
              </span>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 1. UNARRIVED (NEW) */}
          <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200 flex flex-col h-[220px]">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5 text-slate-500" />
                Unarrived (New)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-bold">
                {unarrivedProcesses.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {unarrivedProcesses.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[11px] text-slate-400 italic">
                  All processes arrived
                </div>
              ) : (
                unarrivedProcesses.map((proc) => (
                  <div
                    key={proc.id}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shadow-2xs"
                        style={{ backgroundColor: proc.color }}
                      />
                      <span className="font-bold text-slate-800">{proc.name}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Arrives: <span className="text-blue-600 font-bold">{proc.arrivalTime}ms</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 2. READY QUEUE */}
          <div className="bg-blue-50/40 rounded-xl p-3.5 border border-blue-200 flex flex-col h-[220px]">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-blue-200/80">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Ready Queue
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200">
                {readyProcesses.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {readyProcesses.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[11px] text-slate-400 italic">
                  Queue is empty
                </div>
              ) : (
                readyProcesses.map(({ process: proc, live }, idx) => (
                  <div
                    key={proc!.id}
                    className="p-2.5 bg-white rounded-lg border border-blue-200 text-xs flex items-center justify-between shadow-2xs hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-blue-600 font-bold">
                        #{idx + 1}
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full shadow-2xs"
                        style={{ backgroundColor: proc!.color }}
                      />
                      <span className="font-bold text-slate-900">{proc!.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono">
                      <span className="text-slate-500">
                        Rem: <strong className="text-blue-700">{live.remainingBurst}ms</strong>
                      </span>
                      {live.waitDuration !== undefined && live.waitDuration > 0 && (
                        <span className="text-amber-700 text-[9px] bg-amber-50 px-1 rounded border border-amber-200 font-semibold">
                          wait {live.waitDuration}ms
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. RUNNING STATE */}
          <div className="bg-gradient-to-b from-blue-50/60 to-white rounded-xl p-3.5 border-2 border-blue-500/80 shadow-sm flex flex-col h-[220px]">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-blue-200">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-blue-600" />
                CPU Core 0 (Running)
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs animate-pulse" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-2 text-center">
              {runningProcess && runningPcb ? (
                <div className="w-full space-y-2.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-blue-200 shadow-2xs">
                    <span
                      className="w-3 h-3 rounded-full shadow-2xs"
                      style={{ backgroundColor: runningProcess.color }}
                    />
                    <span className="text-sm font-bold text-slate-900 font-sans">
                      {runningProcess.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                    <div>
                      <span className="text-slate-400 block font-sans">Remaining</span>
                      <strong className="text-blue-700 text-xs">
                        {runningPcb.remainingBurst} ms
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans">Priority</span>
                      <strong className="text-purple-700 text-xs">
                        {runningProcess.priority}
                      </strong>
                    </div>
                  </div>

                  {/* Progress Bar of current burst */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-200"
                      style={{
                        width: `${
                          ((runningProcess.burstTime - runningPcb.remainingBurst) /
                            runningProcess.burstTime) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-slate-400 font-sans text-xs">
                  <Activity className="w-6 h-6 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-500">CPU Idle</p>
                  <p className="text-[11px] text-slate-400">Waiting for process arrival</p>
                </div>
              )}
            </div>
          </div>

          {/* 4. TERMINATED QUEUE */}
          <div className="bg-emerald-50/40 rounded-xl p-3.5 border border-emerald-200 flex flex-col h-[220px]">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-emerald-200">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Completed
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                {terminatedProcesses.length} / {processes.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {terminatedProcesses.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[11px] text-slate-400 italic">
                  No completed jobs yet
                </div>
              ) : (
                terminatedProcesses.map(({ process: proc, result }) => (
                  <div
                    key={proc!.id}
                    className="p-2.5 bg-white rounded-lg border border-emerald-200 text-xs flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shadow-2xs"
                        style={{ backgroundColor: proc!.color }}
                      />
                      <span className="font-bold text-slate-800">{proc!.name}</span>
                    </div>
                    <div className="text-[10px] font-mono text-emerald-700 font-bold">
                      TAT: {result?.turnaroundTime}ms
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Step Explanation Banner */}
        {timeStep && (
          <div className="px-5 py-3.5 bg-slate-50/90 border-t border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
            <Terminal className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="font-sans text-[11px]">
              <strong className="text-blue-700 font-mono">Log [t={currentTime}ms]:</strong> {timeStep.eventLog}{' '}
              <span className="text-slate-500">— {timeStep.explanation}</span>
            </div>
          </div>
        )}
      </div>

      {/* Gantt Timeline */}
      <GanttChart
        segments={simulation.gantt}
        totalTime={simulation.metrics.totalTime}
        currentTime={currentTime}
        highlightCurrentBlock={true}
        algorithmTitle={simulation.title}
        processResults={simulation.processResults}
        timeStepState={timeStep}
      />

      {/* Primary KPI Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Average Turnaround Time */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Avg Turnaround Time
            </span>
            <div className="text-xl sm:text-2xl font-mono font-bold text-blue-700 mt-1">
              {simulation.metrics.avgTurnaroundTime.toFixed(2)}{' '}
              <span className="text-xs font-normal text-slate-400 font-sans">ms</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Average Waiting Time */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Avg Waiting Time
            </span>
            <div className="text-xl sm:text-2xl font-mono font-bold text-amber-700 mt-1">
              {simulation.metrics.avgWaitingTime.toFixed(2)}{' '}
              <span className="text-xs font-normal text-slate-400 font-sans">ms</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Hourglass className="w-5 h-5" />
          </div>
        </div>

        {/* Average Response Time */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Avg Response Time
            </span>
            <div className="text-xl sm:text-2xl font-mono font-bold text-purple-700 mt-1">
              {simulation.metrics.avgResponseTime.toFixed(2)}{' '}
              <span className="text-xs font-normal text-slate-400 font-sans">ms</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* CPU Utilization */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              CPU Efficiency
            </span>
            <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-700 mt-1">
              {simulation.metrics.cpuUtilization.toFixed(1)}
              <span className="text-xs font-normal text-slate-400 font-sans">%</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Gauge className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
