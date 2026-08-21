import React, { useState } from 'react';
import {
  Activity,
  Clock,
  Zap,
  Layers,
  CheckCircle2,
  Hourglass,
  Flame,
  Info,
  Sliders,
} from 'lucide-react';
import { GanttSegment, ProcessResult, TimeStepState } from '../types';

interface GanttChartProps {
  segments: GanttSegment[];
  totalTime: number;
  currentTime?: number;
  highlightCurrentBlock?: boolean;
  algorithmTitle?: string;
  processResults?: ProcessResult[];
  timeStepState?: TimeStepState;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  segments,
  totalTime,
  currentTime,
  highlightCurrentBlock = false,
  algorithmTitle,
  processResults = [],
  timeStepState,
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<GanttSegment | null>(null);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  if (!segments || segments.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 font-sans text-xs shadow-sm">
        No execution timeline available. Add processes to generate Gantt chart.
      </div>
    );
  }

  const effectiveTotalTime = Math.max(totalTime, segments[segments.length - 1]?.endTime || 1);

  // Find result of hovered or selected process
  const activeProcessResult = hoveredSegment?.processId
    ? processResults.find((r) => r.id === hoveredSegment.processId)
    : selectedProcessId
    ? processResults.find((r) => r.id === selectedProcessId)
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Chart Header */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Interactive Gantt Timeline {algorithmTitle && <span className="text-blue-600">({algorithmTitle})</span>}
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-sans">
          <span className="text-slate-500">
            Total Duration: <strong className="text-blue-700 font-mono font-bold">{effectiveTotalTime} ms</strong>
          </span>
          <span className="text-slate-500">
            Slices: <strong className="text-slate-800 font-mono font-bold">{segments.length}</strong>
          </span>
          {currentTime !== undefined && (
            <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono">
              t = {currentTime} ms
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* Main Gantt Visual Bar */}
        <div className="relative pt-1 pb-6">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>CPU Execution Sequence</span>
            <span className="text-[11px] text-slate-400 font-normal normal-case">
              Hover over slices to inspect metrics
            </span>
          </div>

          <div
            className="h-16 sm:h-20 w-full bg-slate-100 rounded-xl border border-slate-300 flex overflow-hidden shadow-inner relative"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            }}
            onMouseLeave={() => {
              setHoveredSegment(null);
              setMousePos(null);
            }}
          >
            {segments.map((seg, idx) => {
              const duration = seg.endTime - seg.startTime;
              const widthPct = (duration / effectiveTotalTime) * 100;
              const isCurrent =
                currentTime !== undefined &&
                currentTime >= seg.startTime &&
                currentTime < seg.endTime;
              const isHovered = hoveredSegment === seg;
              const isDimmed =
                hoveredSegment &&
                hoveredSegment.processId !== null &&
                seg.processId !== hoveredSegment.processId;

              if (seg.processId === null || seg.processName === 'IDLE' || seg.processName === 'Idle') {
                return (
                  <div
                    key={`idle-${idx}`}
                    onMouseEnter={() => setHoveredSegment(seg)}
                    style={{ width: `${widthPct}%` }}
                    className={`h-full bg-slate-200/80 bg-stripes flex flex-col items-center justify-center border-r border-slate-300 text-slate-500 font-mono text-[10px] select-none transition-all cursor-crosshair ${
                      isCurrent && highlightCurrentBlock ? 'ring-2 ring-amber-500 z-10' : ''
                    } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
                    title={`IDLE [${seg.startTime} - ${seg.endTime}ms]`}
                  >
                    <span className="font-bold text-slate-600">IDLE</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {duration}ms
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={`seg-${idx}-${seg.processId}`}
                  onMouseEnter={() => setHoveredSegment(seg)}
                  onClick={() =>
                    setSelectedProcessId((prev) =>
                      prev === seg.processId ? null : seg.processId
                    )
                  }
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: seg.color || '#3b82f6',
                  }}
                  className={`h-full flex flex-col items-center justify-center border-r border-white/40 text-white font-sans text-xs select-none transition-all relative cursor-pointer ${
                    isHovered
                      ? 'brightness-110 scale-y-105 z-30 shadow-lg'
                      : 'hover:brightness-105'
                  } ${
                    isCurrent && highlightCurrentBlock
                      ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-white z-20'
                      : ''
                  } ${isDimmed ? 'opacity-30 saturate-50' : 'opacity-100'}`}
                >
                  <span className="font-extrabold drop-shadow-xs text-[11px] sm:text-xs">
                    {seg.processName}
                  </span>
                  <span className="text-[10px] font-semibold opacity-95">
                    {duration}ms
                  </span>
                  {/* Slice interval indicator */}
                  <span className="text-[9px] opacity-85 font-mono hidden sm:inline">
                    [{seg.startTime}–{seg.endTime}]
                  </span>
                </div>
              );
            })}
          </div>

          {/* Time scale ticks */}
          <div className="relative w-full h-6 mt-1.5">
            {/* Start timestamp 0 */}
            <div className="absolute left-0 top-0 text-[10px] font-mono text-slate-500 -translate-x-1/2">
              0
            </div>

            {/* End timestamp of each slice */}
            {segments.map((seg, idx) => {
              const leftPct = (seg.endTime / effectiveTotalTime) * 100;
              return (
                <div
                  key={`time-tick-${idx}`}
                  style={{ left: `${leftPct}%` }}
                  className="absolute top-0 flex flex-col items-center -translate-x-1/2 pointer-events-none"
                >
                  <div className="w-[1px] h-2 bg-slate-300" />
                  <span className="text-[10px] font-mono text-slate-500">
                    {seg.endTime}
                  </span>
                </div>
              );
            })}

            {/* Current Simulation Time Marker */}
            {currentTime !== undefined && currentTime <= effectiveTotalTime && (
              <div
                style={{ left: `${(currentTime / effectiveTotalTime) * 100}%` }}
                className="absolute top-[-5.5rem] bottom-[-0.5rem] w-0.5 bg-rose-500 shadow-sm z-30 transition-all pointer-events-none"
              >
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-rose-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                  {currentTime}ms
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rich Interactive Hover Detail Card */}
        {hoveredSegment && (
          <div className="p-4 bg-slate-50 rounded-xl border border-blue-200 shadow-sm text-xs animate-in fade-in zoom-in-95 duration-150">
            {hoveredSegment.processId === null ? (
              <div className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                  <span className="font-bold text-slate-800">CPU IDLE State</span>
                  <span className="text-slate-500 font-mono">
                    [{hoveredSegment.startTime}ms → {hoveredSegment.endTime}ms]
                  </span>
                </div>
                <div className="font-mono text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Idle Duration: {hoveredSegment.endTime - hoveredSegment.startTime} ms
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-xs border border-white"
                      style={{ backgroundColor: hoveredSegment.color }}
                    />
                    <span className="font-bold text-slate-900 text-sm font-sans">
                      {hoveredSegment.processName}
                    </span>
                    <span className="text-[11px] font-mono text-blue-700 bg-white border border-blue-200 px-2.5 py-0.5 rounded-md shadow-2xs font-semibold">
                      Interval: {hoveredSegment.startTime}ms → {hoveredSegment.endTime}ms ({hoveredSegment.endTime - hoveredSegment.startTime}ms)
                    </span>
                    {activeProcessResult && activeProcessResult.agingBoostCount > 0 && (
                      <span className="text-[10px] font-sans bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500" />
                        Aged (+{activeProcessResult.agingBoostCount} Boost)
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-sans">
                    All times in milliseconds (ms)
                  </span>
                </div>

                {activeProcessResult && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2 border-t border-slate-200">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">
                        Arrival Time (AT)
                      </span>
                      <strong className="text-sm font-mono text-slate-800">
                        {activeProcessResult.arrivalTime} ms
                      </strong>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">
                        Burst Time (BT)
                      </span>
                      <strong className="text-sm font-mono text-emerald-700">
                        {activeProcessResult.burstTime} ms
                      </strong>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">
                        Completion (CT)
                      </span>
                      <strong className="text-sm font-mono text-blue-700">
                        {activeProcessResult.completionTime} ms
                      </strong>
                    </div>

                    <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-200 shadow-2xs">
                      <span className="text-[10px] uppercase text-blue-700 font-bold block">
                        Turnaround (TAT)
                      </span>
                      <strong className="text-sm font-mono text-blue-900">
                        {activeProcessResult.turnaroundTime} ms
                      </strong>
                    </div>

                    <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200 shadow-2xs">
                      <span className="text-[10px] uppercase text-amber-700 font-bold block">
                        Waiting Time (WT)
                      </span>
                      <strong className="text-sm font-mono text-amber-900">
                        {activeProcessResult.waitingTime} ms
                      </strong>
                    </div>

                    <div className="p-2.5 bg-purple-50/60 rounded-lg border border-purple-200 shadow-2xs">
                      <span className="text-[10px] uppercase text-purple-700 font-bold block">
                        Priority
                      </span>
                      <strong className="text-sm font-mono text-purple-900">
                        {activeProcessResult.priority}
                        {activeProcessResult.finalPriority !== activeProcessResult.priority && (
                          <span className="text-[11px] text-amber-600 ml-1 font-bold">
                            → {activeProcessResult.finalPriority}
                          </span>
                        )}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Live Process Execution States Matrix */}
        {processResults && processResults.length > 0 && (
          <div className="pt-2 border-t border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Process Execution States & Details
              </h4>
              <span className="text-[11px] text-slate-400 font-sans">
                Click any card to highlight in timeline
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {processResults.map((pr) => {
                // Determine dynamic state at currentTime if timeStepState is provided
                const liveState = timeStepState?.pcb[pr.id];
                const isSelected = selectedProcessId === pr.id;
                const isHovered = hoveredSegment?.processId === pr.id;

                let stateBadge = {
                  label: 'Completed',
                  bg: 'bg-emerald-50',
                  text: 'text-emerald-700',
                  border: 'border-emerald-200',
                };

                if (currentTime !== undefined && liveState) {
                  if (liveState.state === 'NOT_ARRIVED') {
                    stateBadge = {
                      label: 'Not Arrived',
                      bg: 'bg-slate-100',
                      text: 'text-slate-500',
                      border: 'border-slate-200',
                    };
                  } else if (liveState.state === 'READY') {
                    stateBadge = {
                      label: 'Ready / Waiting',
                      bg: 'bg-amber-50',
                      text: 'text-amber-700',
                      border: 'border-amber-200',
                    };
                  } else if (liveState.state === 'RUNNING') {
                    stateBadge = {
                      label: 'Running (Core)',
                      bg: 'bg-blue-50',
                      text: 'text-blue-700',
                      border: 'border-blue-400 font-bold',
                    };
                  } else if (liveState.state === 'TERMINATED') {
                    stateBadge = {
                      label: 'Terminated',
                      bg: 'bg-emerald-50',
                      text: 'text-emerald-700',
                      border: 'border-emerald-200',
                    };
                  }
                }

                return (
                  <div
                    key={pr.id}
                    onClick={() =>
                      setSelectedProcessId((prev) => (prev === pr.id ? null : pr.id))
                    }
                    onMouseEnter={() => {
                      const firstSeg = segments.find((s) => s.processId === pr.id);
                      if (firstSeg) setHoveredSegment(firstSeg);
                    }}
                    onMouseLeave={() => setHoveredSegment(null)}
                    className={`p-3.5 bg-white rounded-xl border transition-all cursor-pointer shadow-2xs ${
                      isSelected || isHovered
                        ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0 shadow-2xs border border-white"
                          style={{ backgroundColor: pr.color }}
                        />
                        <span className="font-bold text-slate-800 font-sans text-xs">
                          {pr.name}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${stateBadge.bg} ${stateBadge.text} ${stateBadge.border}`}
                      >
                        {stateBadge.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono text-slate-500">
                      <div>
                        <span className="text-slate-400 block text-[9px] font-sans">AT/BT</span>
                        <span className="text-slate-700">{pr.arrivalTime} / {pr.burstTime}ms</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] font-sans">TAT</span>
                        <span className="text-blue-700 font-bold">{pr.turnaroundTime}ms</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] font-sans">WT</span>
                        <span className="text-amber-700 font-bold">{pr.waitingTime}ms</span>
                      </div>
                    </div>

                    {pr.agingBoostCount > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-purple-700">
                        <span className="flex items-center gap-1 font-sans">
                          <Flame className="w-3 h-3 text-amber-500" /> Aging Boost:
                        </span>
                        <span className="font-bold">+{pr.agingBoostCount} (P: {pr.priority} → {pr.finalPriority})</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

