import React from 'react';
import { X, BookOpen, Clock, Activity, Cpu, Zap, CheckCircle2, HelpCircle } from 'lucide-react';

interface FormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormulaModal: React.FC<FormulaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              CPU Scheduling Mathematical Formulas & Principles
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600">
          {/* Key Metrics Calculation Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Core Execution Metrics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Turnaround Time (TAT) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Turnaround Time (TAT)</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    TAT = CT - AT
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Total time elapsed from process arrival in the ready queue to its final completion.
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-blue-700 font-semibold shadow-2xs">
                  Turnaround Time = Completion Time - Arrival Time
                </div>
              </div>

              {/* Waiting Time (WT) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Waiting Time (WT)</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    WT = TAT - BT
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Total time spent in the Ready Queue waiting to be allocated CPU execution time.
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-amber-800 font-semibold shadow-2xs">
                  Waiting Time = Turnaround Time - Burst Time
                </div>
              </div>

              {/* Response Time (RT) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Response Time (RT)</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                    RT = First Run - AT
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Time from arrival until the process first gains access to the CPU core.
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-purple-800 font-semibold shadow-2xs">
                  Response Time = First CPU Allocation Time - Arrival Time
                </div>
              </div>

              {/* CPU Utilization */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">CPU Utilization (%)</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Util = (Busy / Total) * 100
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Percentage of simulation timeline during which the CPU performed active execution.
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-emerald-800 font-semibold shadow-2xs">
                  CPU Util = ((Total Time - Idle Time) / Total Time) × 100%
                </div>
              </div>
            </div>
          </div>

          {/* Algorithm Mechanics Deep Dive */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              Scheduling Policies Summary
            </h3>

            <div className="space-y-2.5">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900">FCFS (First-Come, First-Served):</span>
                <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                  Non-preemptive queue where jobs run in strict arrival sequence. Can suffer from the{' '}
                  <strong className="text-rose-600 font-bold">Convoy Effect</strong> when a long CPU burst blocks
                  subsequent short processes.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900">SJF & SRTF (Shortest Job First / Shortest Remaining Time):</span>
                <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                  Provably optimal for minimizing Average Waiting Time. SRTF is the preemptive variant that
                  switches as soon as a job with a shorter remaining burst arrives in the ready queue.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900">Round Robin (RR):</span>
                <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                  Designed for time-sharing systems. Each process is allocated a fixed time quantum (Q).
                  If Q is too small, context switch overhead degrades performance; if Q is huge, RR behaves like FCFS.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900">Priority Scheduling with Dynamic Aging:</span>
                <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                  Allocates CPU according to priority ranking (Preemptive or Non-Preemptive). Starvation is prevented by
                  the Aging engine which dynamically increments priority as wait time exceeds defined thresholds.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
          >
            Close Reference Guide
          </button>
        </div>
      </div>
    </div>
  );
};
