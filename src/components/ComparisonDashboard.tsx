import React, { useState, useMemo } from 'react';
import {
  Trophy,
  BarChart2,
  TrendingDown,
  Clock,
  Hourglass,
  Zap,
  Gauge,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  AlgorithmSimulationResult,
  AlgorithmType,
  Process,
  SchedulerConfig,
} from '../types';
import { runSimulation } from '../utils/scheduler';
import { GanttChart } from './GanttChart';

interface ComparisonDashboardProps {
  processes: Process[];
  config: SchedulerConfig;
  onSelectAlgorithmForSimulator: (algo: AlgorithmType) => void;
}

const ALL_ALGORITHMS: AlgorithmType[] = [
  'FCFS',
  'SJF_NP',
  'SRTF',
  'RR',
  'PRIORITY_NP',
  'PRIORITY_P',
];

export const ComparisonDashboard: React.FC<ComparisonDashboardProps> = ({
  processes,
  config,
  onSelectAlgorithmForSimulator,
}) => {
  const [metricView, setMetricView] = useState<'waiting' | 'turnaround' | 'response'>('waiting');
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmType>('FCFS');

  // Compute simulations for all algorithms
  const allResults: AlgorithmSimulationResult[] = useMemo(() => {
    return ALL_ALGORITHMS.map((algo) => runSimulation(processes, algo, config));
  }, [processes, config]);

  // Determine optimal performers
  const optimalWaiting = useMemo(() => {
    return allResults.reduce((best, curr) =>
      curr.metrics.avgWaitingTime < best.metrics.avgWaitingTime ? curr : best
    );
  }, [allResults]);

  const optimalTurnaround = useMemo(() => {
    return allResults.reduce((best, curr) =>
      curr.metrics.avgTurnaroundTime < best.metrics.avgTurnaroundTime ? curr : best
    );
  }, [allResults]);

  // Max bounds for bar scaling
  const maxTAT = Math.max(...allResults.map((r) => r.metrics.avgTurnaroundTime), 1);
  const maxWT = Math.max(...allResults.map((r) => r.metrics.avgWaitingTime), 1);
  const maxRT = Math.max(...allResults.map((r) => r.metrics.avgResponseTime), 1);
  const maxTotalTime = Math.max(...allResults.map((r) => r.metrics.totalTime), 1);

  return (
    <div className="space-y-6">
      {/* Optimal Recommendation Card */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50/30 rounded-2xl border border-blue-200 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                Optimal Scheduling Analysis
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              <span className="text-blue-700">{optimalWaiting.title}</span> achieves minimum Waiting Time (
              {optimalWaiting.metrics.avgWaitingTime.toFixed(2)} ms)
            </h3>
            <p className="text-xs text-slate-600">
              For this workload, {optimalTurnaround.title} also yielded optimal Turnaround Time (
              {optimalTurnaround.metrics.avgTurnaroundTime.toFixed(2)} ms).
            </p>
          </div>
        </div>

        <button
          id="btn-apply-optimal-algo"
          onClick={() => onSelectAlgorithmForSimulator(optimalWaiting.algorithm)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-2 flex-shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch in Simulator</span>
        </button>
      </div>

      {/* Comparative Charts & Ranking Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metric Bar Comparison Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Comparative Policy Benchmarks
                </h3>
              </div>

              {/* Metric View Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  id="tab-metric-waiting"
                  onClick={() => setMetricView('waiting')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    metricView === 'waiting'
                      ? 'bg-white text-amber-800 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Waiting Time
                </button>
                <button
                  id="tab-metric-turnaround"
                  onClick={() => setMetricView('turnaround')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    metricView === 'turnaround'
                      ? 'bg-white text-blue-800 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Turnaround Time
                </button>
                <button
                  id="tab-metric-response"
                  onClick={() => setMetricView('response')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    metricView === 'response'
                      ? 'bg-white text-purple-800 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Response Time
                </button>
              </div>
            </div>

            {/* Visual Bars */}
            <div className="space-y-3 pt-1">
              {allResults.map((res) => {
                let val = 0;
                let max = 1;
                let colorClass = 'from-blue-500 to-indigo-600';
                let isWinner = false;

                if (metricView === 'waiting') {
                  val = res.metrics.avgWaitingTime;
                  max = maxWT;
                  colorClass = 'from-amber-500 to-amber-600';
                  isWinner = res.algorithm === optimalWaiting.algorithm;
                } else if (metricView === 'turnaround') {
                  val = res.metrics.avgTurnaroundTime;
                  max = maxTAT;
                  colorClass = 'from-blue-500 to-cyan-600';
                  isWinner = res.algorithm === optimalTurnaround.algorithm;
                } else {
                  val = res.metrics.avgResponseTime;
                  max = maxRT;
                  colorClass = 'from-purple-500 to-purple-700';
                }

                const widthPct = Math.max(6, (val / max) * 100);

                return (
                  <div
                    key={res.algorithm}
                    onClick={() => setSelectedAlgo(res.algorithm)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                      selectedAlgo === res.algorithm
                        ? 'bg-blue-50/50 border-blue-500 ring-1 ring-blue-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-sans">{res.title}</span>
                        {isWinner && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            MINIMAL
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xs font-bold text-slate-800">
                        {val.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">ms</span>
                      </div>
                    </div>

                    {/* Bar visualization */}
                    <div className="w-full bg-slate-150 bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-500`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-sans pt-3 border-t border-slate-200 mt-4 flex items-center justify-between">
            <span>Lower values indicate superior turnaround latency and CPU throughput.</span>
            <span className="text-slate-400">Click card to select</span>
          </div>
        </div>

        {/* Algorithm Leaderboard Ranking Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-200">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Performance Leaderboard
            </h3>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto">
            {allResults
              .slice()
              .sort((a, b) => a.metrics.avgWaitingTime - b.metrics.avgWaitingTime)
              .map((res, rank) => (
                <div
                  key={res.algorithm}
                  onClick={() => setSelectedAlgo(res.algorithm)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition shadow-2xs ${
                    selectedAlgo === res.algorithm
                      ? 'bg-blue-50/60 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[11px] ${
                        rank === 0
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : rank === 1
                          ? 'bg-slate-200 text-slate-800 border border-slate-300'
                          : rank === 2
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {rank + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {res.algorithm}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Util: {res.metrics.cpuUtilization.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-xs font-bold text-amber-700 block">
                      WT: {res.metrics.avgWaitingTime.toFixed(1)}ms
                    </span>
                    <span className="text-[10px] text-slate-500">
                      TAT: {res.metrics.avgTurnaroundTime.toFixed(1)}ms
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Multi-Algorithm Gantt Timeline Comparison */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Aligned Multi-Algorithm Timelines
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Normalized against max span ({maxTotalTime} ms)
          </span>
        </div>

        <div className="space-y-4">
          {allResults.map((res) => (
            <div
              key={res.algorithm}
              className={`p-3.5 rounded-xl border transition ${
                selectedAlgo === res.algorithm
                  ? 'bg-blue-50/30 border-blue-400'
                  : 'bg-slate-50/50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 font-sans">
                    {res.title}
                  </span>
                  <button
                    onClick={() => onSelectAlgorithmForSimulator(res.algorithm)}
                    className="text-[11px] font-sans font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                  >
                    Open in Simulator <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-blue-700">
                    Avg TAT: <strong>{res.metrics.avgTurnaroundTime.toFixed(2)}ms</strong>
                  </span>
                  <span className="text-amber-700">
                    Avg WT: <strong>{res.metrics.avgWaitingTime.toFixed(2)}ms</strong>
                  </span>
                </div>
              </div>

              {/* Gantt Timeline */}
              <GanttChart
                segments={res.gantt}
                totalTime={maxTotalTime}
                algorithmTitle={res.title}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
