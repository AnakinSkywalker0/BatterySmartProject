'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Terminal, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LogsSimulation() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const simulationLog = [
    '[Demand Agent] Analyzing historical data... 23% match found',
    '[Demand Agent] Surge predicted (ML model 87% confidence)',
    '[Demand Agent] → Action: Reroute 5 drivers from DEL-02',
    '',
    '[Maintenance Agent] Scanning charger health metrics...',
    '[Maintenance Agent] Fault pattern detected: Batman unit overheating',
    '[Maintenance Agent] → Action: Create maintenance ticket #2847',
    '',
    '[Optimizer Agent] Running inventory rebalancing algorithm...',
    '[Optimizer Agent] Optimal solution found: Transfer 20 units',
    '[Optimizer Agent] → Action: Dispatch transfer vehicle from DEL-07',
    '',
    '[System] All agents coordinated successfully',
    '[System] Fleet efficiency optimized to 94.2%',
  ];

  useEffect(() => {
    if (isPlaying && logs.length < simulationLog.length) {
      const timeout = setTimeout(() => {
        setLogs((prev) => [...prev, simulationLog[prev.length]]);
      }, 300);
      return () => clearTimeout(timeout);
    } else if (logs.length === simulationLog.length) {
      setIsPlaying(false);
    }
  }, [isPlaying, logs.length]);

  const handlePlayPause = () => {
    if (logs.length === simulationLog.length) {
      setLogs([]);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setLogs([]);
    setIsPlaying(false);
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover-lift animate-slide-in-up">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 cursor-pointer hover:bg-secondary/20 transition-colors border-b border-border"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Terminal className="w-4 sm:w-5 h-4 sm:h-5 text-accent flex-shrink-0" />
          <h2 className="text-sm sm:text-lg font-semibold text-foreground truncate">Agent Console & Simulation</h2>
        </div>
        <ChevronDown
          className={`w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-4 animate-slide-in-down">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-secondary/20 border border-border">
            <Button
              size="sm"
              onClick={handlePlayPause}
              className={`${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-accent hover:bg-accent/90'} text-white`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Play Demo
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="bg-secondary hover:bg-secondary/80"
            >
              Reset
            </Button>

            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-muted'}`} />
                <span className="text-sm text-muted-foreground">
                  {isPlaying ? 'Simulation running...' : logs.length > 0 ? 'Simulation paused' : 'Ready to run'}
                </span>
              </div>
            </div>
          </div>

          {/* Console Output */}
          <div className="bg-gradient-to-b from-gray-950 to-gray-900 rounded-lg border border-border p-3 sm:p-4 font-mono text-xs sm:text-sm text-green-400 space-y-1 h-48 sm:h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-muted-foreground text-xs">
                <p>$ battery-smart-copilot --run-simulation</p>
                <p className="mt-2">Ready to simulate multi-agent coordination...</p>
                <p className="text-yellow-500">Click "Play Demo" to start</p>
              </div>
            ) : (
              logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`text-xs sm:text-sm ${
                    log.includes('→') ? 'text-accent font-semibold' : log.includes('[System]') ? 'text-blue-400' : log.includes('[Demand]') ? 'text-purple-400' : log.includes('[Maintenance]') ? 'text-yellow-400' : log.includes('[Optimizer]') ? 'text-green-400' : 'text-gray-500'
                  }`}
                >
                  {log || '\u00A0'}
                </div>
              ))
            )}
            {isPlaying && (
              <div className="text-green-400">
                <span className="animate-pulse">▌</span>
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-lg bg-secondary/20 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1 sm:mb-2">Demand Forecasting</p>
              <p className="text-base sm:text-lg font-bold text-accent">87%</p>
              <p className="text-xs text-muted-foreground mt-1">Model Confidence</p>
            </div>

            <div className="p-3 sm:p-4 rounded-lg bg-secondary/20 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1 sm:mb-2">Fleet Efficiency</p>
              <p className="text-base sm:text-lg font-bold text-green-400">94.2%</p>
              <p className="text-xs text-muted-foreground mt-1">After optimization</p>
            </div>
          </div>

          {/* Info Section */}
          <div className="p-3 sm:p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-xs sm:text-sm text-blue-300 leading-relaxed">
              This simulation demonstrates how Battery Smart's Agentic AI Copilot orchestrates multiple autonomous agents to manage fleet operations. Predictive fault detection reduces downtime
              {' '}
              <span className="font-semibold">25%</span>
              {' '}
              while intelligent routing optimizes battery utilization and reduces costs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
