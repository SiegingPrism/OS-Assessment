import React from 'react';
import { Plus, Trash2, RotateCcw, Shuffle, Sparkles, Hash, Clock, Zap, Award } from 'lucide-react';
import { Process } from '../types';
import { DEFAULT_COLORS } from '../data/presets';

interface ProcessTableProps {
  processes: Process[];
  onChangeProcesses: (processes: Process[]) => void;
  onAddProcess: () => void;
  onReset: () => void;
  onRandomize: () => void;
}

export const ProcessTable: React.FC<ProcessTableProps> = ({
  processes,
  onChangeProcesses,
  onAddProcess,
  onReset,
  onRandomize,
}) => {
  const handleUpdate = (index: number, field: keyof Process, value: string | number) => {
    const updated = [...processes];
    let parsedVal = value;

    if (field === 'arrivalTime') {
      const num = parseInt(value as string, 10);
      parsedVal = isNaN(num) ? 0 : Math.max(0, num);
    } else if (field === 'burstTime') {
      const num = parseInt(value as string, 10);
      parsedVal = isNaN(num) ? 1 : Math.max(1, num);
    } else if (field === 'priority') {
      const num = parseInt(value as string, 10);
      parsedVal = isNaN(num) ? 1 : Math.max(1, num);
    }

    updated[index] = {
      ...updated[index],
      [field]: parsedVal,
    };
    onChangeProcesses(updated);
  };

  const handleRemove = (index: number) => {
    if (processes.length <= 1) return;
    const updated = processes.filter((_, i) => i !== index);
    onChangeProcesses(updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header bar */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Process Workload
          </h2>
          <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {processes.length} Processes
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-table-add-process"
            onClick={onAddProcess}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
          <button
            id="btn-table-randomize"
            onClick={onRandomize}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 transition shadow-xs"
            title="Generate Random Workload"
          >
            <Shuffle className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Random</span>
          </button>
          <button
            id="btn-table-reset"
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 transition shadow-xs"
            title="Reset to default workload"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto flex-1 max-h-[300px] sm:max-h-[360px] overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/90 text-slate-600 sticky top-0 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200 backdrop-blur-xs">
            <tr>
              <th className="py-3 px-4">Process</th>
              <th className="py-3 px-2">Arrival (AT)</th>
              <th className="py-3 px-2">Burst (BT)</th>
              <th className="py-3 px-2">Priority</th>
              <th className="py-3 px-2 text-center">Color</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {processes.map((proc, index) => (
              <tr
                key={proc.id}
                className="hover:bg-blue-50/40 transition-colors group"
              >
                {/* Process Name & ID */}
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs border border-white"
                      style={{ backgroundColor: proc.color }}
                    />
                    <input
                      type="text"
                      value={proc.name}
                      onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                      className="w-20 sm:w-24 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                    />
                  </div>
                </td>

                {/* Arrival Time */}
                <td className="py-2.5 px-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={proc.arrivalTime}
                      onChange={(e) => handleUpdate(index, 'arrivalTime', e.target.value)}
                      className="w-16 px-2.5 py-1 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right shadow-2xs"
                    />
                    <span className="text-[11px] text-slate-400 font-mono">ms</span>
                  </div>
                </td>

                {/* Burst Time */}
                <td className="py-2.5 px-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={proc.burstTime}
                      onChange={(e) => handleUpdate(index, 'burstTime', e.target.value)}
                      className="w-16 px-2.5 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right shadow-2xs"
                    />
                    <span className="text-[11px] text-slate-400 font-mono">ms</span>
                  </div>
                </td>

                {/* Priority */}
                <td className="py-2.5 px-2">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={proc.priority}
                    onChange={(e) => handleUpdate(index, 'priority', e.target.value)}
                    className="w-14 px-2.5 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-right shadow-2xs"
                  />
                </td>

                {/* Color Tag Picker */}
                <td className="py-2.5 px-2 text-center">
                  <input
                    type="color"
                    value={proc.color}
                    onChange={(e) => handleUpdate(index, 'color', e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200 bg-white p-0.5 inline-block align-middle shadow-2xs"
                    title="Change process color"
                  />
                </td>

                {/* Remove button */}
                <td className="py-2.5 px-4 text-right">
                  <button
                    onClick={() => handleRemove(index)}
                    disabled={processes.length <= 1}
                    className={`p-1.5 rounded-lg transition ${
                      processes.length <= 1
                        ? 'opacity-30 cursor-not-allowed text-slate-400'
                        : 'text-rose-500 hover:bg-rose-50 hover:text-rose-700'
                    }`}
                    title={processes.length <= 1 ? 'Must have at least 1 process' : 'Delete process'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>
            Total Burst:{' '}
            <strong className="text-blue-700 font-mono font-bold">
              {processes.reduce((acc, p) => acc + p.burstTime, 0)} ms
            </strong>
          </span>
          <span>
            Arrival Span:{' '}
            <strong className="text-slate-800 font-mono font-semibold">
              {Math.min(...processes.map((p) => p.arrivalTime))} – {Math.max(...processes.map((p) => p.arrivalTime))} ms
            </strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
          Click any field to edit in real time
        </span>
      </div>
    </div>
  );
};
