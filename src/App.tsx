import React, { useState, useMemo } from 'react';
import {
  AlgorithmType,
  Process,
  SchedulerConfig,
  PresetScenario,
} from './types';
import { DEFAULT_COLORS, PRESET_SCENARIOS } from './data/presets';
import { runSimulation } from './utils/scheduler';
import { Header } from './components/Header';
import { ProcessTable } from './components/ProcessTable';
import { AlgorithmSettings } from './components/AlgorithmSettings';
import { LiveSimulator } from './components/LiveSimulator';
import { ComparisonDashboard } from './components/ComparisonDashboard';
import { FormulaModal } from './components/FormulaModal';

export default function App() {
  const initialPreset = PRESET_SCENARIOS[0];

  const [processes, setProcesses] = useState<Process[]>(initialPreset.processes);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('FCFS');
  const [config, setConfig] = useState<SchedulerConfig>({
    timeQuantum: initialPreset.timeQuantum || 2,
    priorityRule: initialPreset.priorityRule || 'LOWER_IS_HIGHER',
  });
  const [selectedPresetId, setSelectedPresetId] = useState<string>(initialPreset.id);
  const [activeTab, setActiveTab] = useState<'simulator' | 'comparison'>('simulator');
  const [isFormulaOpen, setIsFormulaOpen] = useState<boolean>(false);

  // Compute active simulation for the selected algorithm
  const currentSimulation = useMemo(() => {
    return runSimulation(processes, selectedAlgorithm, config);
  }, [processes, selectedAlgorithm, config]);

  // Handlers
  const handleSelectPreset = (preset: PresetScenario) => {
    setSelectedPresetId(preset.id);
    setProcesses(preset.processes.map((p) => ({ ...p })));
    if (preset.timeQuantum) {
      setConfig((prev) => ({ ...prev, timeQuantum: preset.timeQuantum! }));
    }
    if (preset.priorityRule) {
      setConfig((prev) => ({ ...prev, priorityRule: preset.priorityRule! }));
    }
  };

  const handleAddProcess = () => {
    const nextIdx = processes.length + 1;
    const color = DEFAULT_COLORS[(nextIdx - 1) % DEFAULT_COLORS.length];
    const newProc: Process = {
      id: `P${nextIdx}`,
      name: `P${nextIdx}`,
      arrivalTime: Math.max(...processes.map((p) => p.arrivalTime), 0) + 1,
      burstTime: Math.floor(Math.random() * 6) + 2,
      priority: Math.floor(Math.random() * 5) + 1,
      color,
    };
    setProcesses([...processes, newProc]);
  };

  const handleRandomize = () => {
    const count = Math.floor(Math.random() * 3) + 4; // 4 to 6 processes
    const newProcs: Process[] = [];
    let currentArrival = 0;

    for (let i = 1; i <= count; i++) {
      newProcs.push({
        id: `P${i}`,
        name: `P${i}`,
        arrivalTime: currentArrival,
        burstTime: Math.floor(Math.random() * 8) + 2,
        priority: Math.floor(Math.random() * 5) + 1,
        color: DEFAULT_COLORS[(i - 1) % DEFAULT_COLORS.length],
      });
      currentArrival += Math.floor(Math.random() * 3);
    }

    setProcesses(newProcs);
    setSelectedPresetId('');
  };

  const handleReset = () => {
    handleSelectPreset(PRESET_SCENARIOS[0]);
  };

  const handleExport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(processes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'cpu_scheduling_workload.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProcesses(parsed);
          }
        } catch (err) {
          console.error('Error importing scenario:', err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleSelectAlgoFromComparison = (algo: AlgorithmType) => {
    setSelectedAlgorithm(algo);
    setActiveTab('simulator');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-200 selection:text-blue-900">
      {/* Global Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPreset={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onAddProcess={handleAddProcess}
        onRandomize={handleRandomize}
        onReset={handleReset}
        onOpenFormulas={() => setIsFormulaOpen(true)}
        onExport={handleExport}
        onImport={handleImport}
        cpuUtilization={currentSimulation.metrics.cpuUtilization}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Top Control Section: Workload Table & Algorithm Config */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Workload Editor Table (7 cols) */}
          <div className="lg:col-span-7">
            <ProcessTable
              processes={processes}
              onChangeProcesses={(newProcs) => {
                setProcesses(newProcs);
                setSelectedPresetId('');
              }}
              onAddProcess={handleAddProcess}
              onReset={handleReset}
              onRandomize={handleRandomize}
            />
          </div>

          {/* Algorithm Settings & Config (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <AlgorithmSettings
              selectedAlgorithm={selectedAlgorithm}
              onSelectAlgorithm={setSelectedAlgorithm}
              config={config}
              onChangeConfig={setConfig}
            />
          </div>
        </div>

        {/* View Tab Body */}
        {activeTab === 'simulator' ? (
          <LiveSimulator
            simulation={currentSimulation}
            processes={processes}
          />
        ) : (
          <ComparisonDashboard
            processes={processes}
            config={config}
            onSelectAlgorithmForSimulator={handleSelectAlgoFromComparison}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 font-sans shadow-xs">
        CPU Process Scheduling Visualizer • Real-Time Engine & Interactive Analytics • FCFS, SJF, SRTF, Round Robin & Priority
      </footer>

      {/* Educational Formula Reference Modal */}
      <FormulaModal
        isOpen={isFormulaOpen}
        onClose={() => setIsFormulaOpen(false)}
      />
    </div>
  );
}
