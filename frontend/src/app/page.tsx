"use client";

import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Server, Users, Database, Cpu, AlertTriangle, CheckCircle2, Info, RefreshCw, Zap, Play, BrainCircuit, BarChart3, ShieldCheck } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type Metrics = {
  traffic_volume: number;
  response_time: number;
  cpu_utilization: number;
  memory_utilization: number;
  db_query_time: number;
  active_users: number;
  system_load: number;
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics>({
    traffic_volume: 100,
    response_time: 200,
    cpu_utilization: 30,
    memory_utilization: 40,
    db_query_time: 50,
    active_users: 500,
    system_load: 0.5,
  });

  const [history, setHistory] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [logs, setLogs] = useState<{time: string, msg: string}[]>([]);
  const [scenario, setScenario] = useState<string>("DATABASE_BOTTLENECK");
  const [modelInfo, setModelInfo] = useState<any>(null);

  // Autonomy State Machine
  const [phase, setPhase] = useState<string>("OBSERVING");
  const [decision, setDecision] = useState<any>(null);
  const [optHistory, setOptHistory] = useState<any[]>([]);
  const [optimization, setOptimization] = useState<string>("NONE");

  const stateRef = useRef({
    phase: 'OBSERVING',
    warnings: 0,
    normals: 0,
    verifyTicks: 0,
    beforeMetrics: null as Metrics | null,
    currentDecision: null as any,
    resetId: 0
  });

  const addLog = (msg: string) => {
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg }, ...prev].slice(0, 15));
  };

  useEffect(() => {
    fetch(`${API_BASE}/model-info`)
      .then(r => r.json())
      .then(data => setModelInfo(data))
      .catch(e => console.error(e));
    addLog("System initialized. ML Monitor active.");
  }, []);

  // Bottleneck & Decision Engine
  const runDecisionEngine = (currentMetrics: Metrics, prob: number) => {
    // 1. Bottleneck Analysis
    const cpuP = Math.max(0, (currentMetrics.cpu_utilization - 30) / 70);
    const dbP = Math.max(0, (currentMetrics.db_query_time - 50) / 450);
    const memP = Math.max(0, (currentMetrics.memory_utilization - 40) / 60);
    const trafficP = Math.max(0, (currentMetrics.traffic_volume - 100) / 900);
    const total = cpuP + dbP + memP + trafficP + 0.001;

    const bN = {
        CPU: cpuP / total,
        DATABASE: dbP / total,
        MEMORY: memP / total,
        TRAFFIC: trafficP / total
    };
    const sortedBn = Object.entries(bN).sort((a,b) => b[1]-a[1]);
    const primary = sortedBn[0][0];
    const secondary = sortedBn[1][0];

    // 2. Candidate Actions Evaluation
    const actions = [
      { id: 'ENABLE_CACHE', name: 'Enable Cache', db_imp: 0.20, resp_imp: 0.30, cpu_imp: 0.10, traffic_imp: 0.50, impact: 0.1, cost: 0.2 },
      { id: 'OPTIMIZE_DATABASE_QUERIES', name: 'Optimize DB Queries', db_imp: 0.60, resp_imp: 0.20, cpu_imp: 0.05, traffic_imp: 0.0, impact: 0.2, cost: 0.4 },
      { id: 'REDUCE_PAGINATION', name: 'Reduce Pagination', db_imp: 0.20, resp_imp: 0.15, cpu_imp: 0.10, traffic_imp: 0.1, impact: 0.3, cost: 0.1 },
      { id: 'DISABLE_HEAVY_COMPONENTS', name: 'Disable Heavy Components', db_imp: 0.05, resp_imp: 0.10, cpu_imp: 0.60, traffic_imp: 0.0, impact: 0.4, cost: 0.1 }
    ];

    const candidates = actions.map(act => {
      // Gain is weighted by what the bottleneck actually is
      const gain = (act.db_imp * bN.DATABASE) + (act.cpu_imp * bN.CPU) + ((act.traffic_imp || 0) * bN.TRAFFIC) + (act.resp_imp * 0.4);
      const score = gain - (act.impact * 0.3) - (act.cost * 0.1);
      return { ...act, gain, score };
    }).sort((a,b) => b.score - a.score);

    const selected = candidates[0];

    // 3. Counterfactual Simulation for Top 2
    const counterfactuals = candidates.slice(0, 2).map(c => ({
        name: c.name,
        resp: currentMetrics.response_time * (1 - c.resp_imp),
        db: currentMetrics.db_query_time * (1 - c.db_imp),
        cpu: currentMetrics.cpu_utilization * (1 - c.cpu_imp)
    }));

    // 4. Generate Reason
    const reason = `${primary} is the primary bottleneck (${(bN[primary as keyof typeof bN]*100).toFixed(0)}% pressure). The ML model predicts a ${(prob*100).toFixed(0)}% probability of degradation. "${selected.name}" was selected because it targets this bottleneck effectively, yielding the highest overall score (${selected.score.toFixed(2)}) with acceptable user impact.`;

    return {
        bottleneck: { primary, secondary, pressures: bN },
        candidates,
        selected,
        counterfactuals,
        reason,
        expectedGain: selected.gain
    };
  };

  // Main simulation tick
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => {
        let next = { ...prev };
        
        next.traffic_volume += (Math.random() - 0.5) * 10;
        
        if (scenario === "HIGH_TRAFFIC") {
          next.traffic_volume += 50;
          next.active_users += 100;
          next.cpu_utilization += 3;
          next.db_query_time += 20;
          next.response_time += 40;
        } else if (scenario === "DATABASE_BOTTLENECK") {
          next.db_query_time += 150;
          next.response_time += 100;
          next.cpu_utilization += 2;
          next.traffic_volume += 10;
        } else if (scenario === "CPU_PRESSURE") {
          next.cpu_utilization += 15;
          next.response_time += 80;
          next.traffic_volume += 10;
        } else if (scenario === "NORMAL") {
          next.traffic_volume += (100 - next.traffic_volume) * 0.1;
          next.active_users += (500 - next.active_users) * 0.1;
          next.cpu_utilization += (30 - next.cpu_utilization) * 0.1;
          next.db_query_time += (50 - next.db_query_time) * 0.1;
          next.response_time += (200 - next.response_time) * 0.1;
          next.memory_utilization += (40 - next.memory_utilization) * 0.1;
        }

        // Apply dynamic optimization dampening based on selected action
        if (optimization === "ENABLE_CACHE") {
          next.db_query_time = Math.max(20, next.db_query_time * 0.55);
          next.response_time = Math.max(50, next.response_time * 0.65);
          next.cpu_utilization = Math.max(20, next.cpu_utilization * 0.85);
        } else if (optimization === "OPTIMIZE_DATABASE_QUERIES") {
          next.db_query_time = Math.max(30, next.db_query_time * 0.70);
          next.response_time = Math.max(100, next.response_time * 0.80);
        } else if (optimization === "REDUCE_PAGINATION") {
          next.db_query_time = Math.max(30, next.db_query_time * 0.80);
          next.response_time = Math.max(100, next.response_time * 0.85);
        } else if (optimization === "DISABLE_HEAVY_COMPONENTS") {
          next.cpu_utilization = Math.max(20, next.cpu_utilization * 0.60);
          next.response_time = Math.max(80, next.response_time * 0.90);
        }

        next.cpu_utilization = Math.min(100, Math.max(1, next.cpu_utilization));
        next.memory_utilization = Math.min(100, Math.max(5, next.memory_utilization));
        next.traffic_volume = Math.max(10, next.traffic_volume);
        
        return next;
      });

      // Verification Tick Logic
      if (stateRef.current.phase === 'VERIFYING') {
        stateRef.current.verifyTicks -= 1;
        if (stateRef.current.verifyTicks <= 0 && stateRef.current.beforeMetrics && stateRef.current.currentDecision) {
          // Measure actual improvement
          setMetrics(currentMetrics => {
            const b = stateRef.current.beforeMetrics!;
            const respImp = (b.response_time - currentMetrics.response_time) / b.response_time;
            const dbImp = (b.db_query_time - currentMetrics.db_query_time) / b.db_query_time;
            const actualImp = Math.max(0, (respImp + dbImp) / 2);
            
            const dec = stateRef.current.currentDecision;
            const expected = dec.selected.gain;
            
            setOptHistory(prev => [{
              time: new Date().toLocaleTimeString(),
              bottleneck: dec.bottleneck.primary,
              prediction: "HIGH_LOAD",
              action: dec.selected.name,
              expected: (expected * 100).toFixed(1) + "%",
              actual: (actualImp * 100).toFixed(1) + "%",
              result: actualImp >= (expected * 0.5) ? "SUCCESS" : "MARGINAL"
            }, ...prev]);

            addLog(`VERIFIED: ${dec.selected.name} yielded ${(actualImp*100).toFixed(1)}% improvement.`);
            
            stateRef.current.phase = 'OBSERVING';
            setPhase('OBSERVING');
            return currentMetrics;
          });
        }
      }

    }, 1500);
    return () => clearInterval(interval);
  }, [scenario, optimization]);

  // Prediction & Autonomy Engine
  useEffect(() => {
    const processTick = async () => {
      try {
        if (stateRef.current.phase === 'OBSERVING') {
          setPhase('PREDICTING');
        }

        const res = await fetch(`${API_BASE}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metrics)
        });
        
        if (!res.ok) return;
        const predData = await res.json();
        
        // Correct Risk Score directly from probability
        const highLoadProb = predData.all_probabilities?.HIGH_LOAD || 0;
        const warningProb = predData.all_probabilities?.WARNING || 0;
        const targetProb = Math.max(highLoadProb, warningProb);
        
        const riskScore = Math.round(highLoadProb * 100);
        setPrediction({ ...predData, risk_score: riskScore, targetProb });

        setHistory(prev => [...prev, { time: new Date().toLocaleTimeString(), ...metrics, risk: riskScore }].slice(-20));

        // UI DIAGNOSTIC LOG (TEMPORARY)
        addLog(`[DIAG] Pred: ${predData.prediction}, Prob: ${(targetProb*100).toFixed(0)}%, Warns: ${stateRef.current.warnings}, Phase: ${stateRef.current.phase}, Opt: ${optimization}`);

        // Autonomy Logic - Phase: OBSERVING
        if (stateRef.current.phase === 'OBSERVING') {
          if (predData.prediction !== "NORMAL" && targetProb >= 0.60 && optimization === "NONE") {
            stateRef.current.warnings += 1;
            if (stateRef.current.warnings >= 3) {
              addLog(`Stability Guard: 3 anomalies detected. Engaging Optimizer.`);
              stateRef.current.phase = 'EVALUATING';
              setPhase('EVALUATING');
              
              // Run Decision Engine
              const newDecision = runDecisionEngine(metrics, targetProb);
              setDecision(newDecision);
              stateRef.current.currentDecision = newDecision;
              stateRef.current.beforeMetrics = { ...metrics };
              
              const currentResetId = stateRef.current.resetId;
              setTimeout(() => {
                if (stateRef.current.resetId !== currentResetId) return;
                stateRef.current.phase = 'OPTIMIZING';
                setPhase('OPTIMIZING');
                setOptimization(newDecision.selected.id);
                addLog(`ACTION SELECTED: ${newDecision.selected.name}`);
                
                setTimeout(() => {
                  if (stateRef.current.resetId !== currentResetId) return;
                  stateRef.current.phase = 'VERIFYING';
                  setPhase('VERIFYING');
                  stateRef.current.verifyTicks = 3;
                }, 1500);
              }, 1500);
            }
          } else {
            stateRef.current.warnings = 0;
            if (stateRef.current.phase === 'OBSERVING') setPhase('OBSERVING');
          }

          // Recovery Logic
          if (predData.prediction === "NORMAL" && predData.probability >= 0.60 && optimization !== "NONE") {
            stateRef.current.normals += 1;
            if (stateRef.current.normals >= 5) {
              addLog("Stability Guard: 5 normal ticks. Recovering...");
              stateRef.current.phase = 'RECOVERING';
              setPhase('RECOVERING');
              
              const currentResetId = stateRef.current.resetId;
              setTimeout(() => {
                if (stateRef.current.resetId !== currentResetId) return;
                setOptimization("NONE");
                setDecision(null);
                stateRef.current.phase = 'OBSERVING';
                setPhase('OBSERVING');
                addLog("SYSTEM RESTORED TO NORMAL CONFIGURATION.");
              }, 1500);
            }
          } else if (predData.prediction !== "NORMAL") {
            stateRef.current.normals = 0;
          }
        }

      } catch (e) {
        console.error(e);
      }
    };
    
    processTick();
  }, [metrics, optimization]);

  const setScenarioAndLog = (s: string) => {
    setScenario(s);
    addLog(`SCENARIO ACTIVATED: ${s}`);
  };

  const renderMetricCard = (title: string, value: string, icon: React.ReactNode, isDanger: boolean) => (
    <div className={`p-4 rounded-xl border ${isDanger ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white'} shadow-sm flex items-center justify-between transition-colors`}>
      <div>
        <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
        <p className={`text-2xl font-bold ${isDanger ? 'text-red-700' : 'text-slate-900'}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${isDanger ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
        {icon}
      </div>
    </div>
  );

  const AutonomyBadge = ({ name, active }: { name: string, active: boolean }) => (
    <div className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${active ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-105' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
      {name}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <BrainCircuit className="text-blue-600" size={32} />
            Self-Optimizing Architecture
          </h1>
          <p className="text-sm text-slate-500 mt-1">ML-driven closed-loop optimization controller</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2 bg-white p-2 rounded-xl border shadow-sm">
            {['OBSERVING', 'PREDICTING', 'EVALUATING', 'OPTIMIZING', 'VERIFYING', 'RECOVERING'].map(p => (
              <AutonomyBadge key={p} name={p} active={phase === p} />
            ))}
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* ML Status Panel */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden">
          {stateRef.current.warnings > 0 && phase === 'OBSERVING' && (
            <div className="absolute top-0 left-0 w-full bg-orange-500 text-white text-[10px] font-bold text-center py-0.5">
              STABILITY GUARD ACTIVE: {stateRef.current.warnings}/3 TICKS
            </div>
          )}
          {stateRef.current.normals > 0 && optimization !== 'NONE' && phase === 'OBSERVING' && (
            <div className="absolute top-0 left-0 w-full bg-blue-500 text-white text-[10px] font-bold text-center py-0.5">
              RECOVERY GUARD ACTIVE: {stateRef.current.normals}/5 TICKS
            </div>
          )}
          
          <div className="mt-2">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><Zap size={20} className="text-blue-600"/> Monitor & Predict</h2>
            {prediction ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Predicted State</p>
                  <p className={`text-2xl font-black ${prediction.prediction === 'HIGH_LOAD' ? 'text-red-600' : prediction.prediction === 'WARNING' ? 'text-orange-500' : 'text-green-600'}`}>
                    {prediction.prediction}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Risk Score</p>
                    <p className="text-xl font-bold">{prediction.risk_score}/100</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Confidence</p>
                    <p className="text-xl font-bold">{(prediction.targetProb * 100).toFixed(1)}%</p>
                  </div>
                </div>

                {decision && decision.bottleneck && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Detected Bottlenecks</p>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-red-600">1. {decision.bottleneck.primary}</span>
                      <span className="text-xs font-bold bg-red-100 text-red-700 px-2 rounded-full">{(decision.bottleneck.pressures[decision.bottleneck.primary]*100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-orange-500">2. {decision.bottleneck.secondary}</span>
                      <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 rounded-full">{(decision.bottleneck.pressures[decision.bottleneck.secondary]*100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Awaiting telemetry...</p>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
          {renderMetricCard("Traffic Volume", `${metrics.traffic_volume.toFixed(0)} req/s`, <Activity size={24} />, metrics.traffic_volume > 400)}
          {renderMetricCard("Response Time", `${metrics.response_time.toFixed(0)} ms`, <Server size={24} />, metrics.response_time > 800)}
          {renderMetricCard("CPU Utilization", `${metrics.cpu_utilization.toFixed(1)}%`, <Cpu size={24} />, metrics.cpu_utilization > 80)}
          {renderMetricCard("DB Query Time", `${metrics.db_query_time.toFixed(0)} ms`, <Database size={24} />, metrics.db_query_time > 300)}
          {renderMetricCard("Active Users", `${metrics.active_users.toFixed(0)}`, <Users size={24} />, false)}
          {renderMetricCard("Memory Util", `${metrics.memory_utilization.toFixed(1)}%`, <Server size={24} />, metrics.memory_utilization > 85)}
        </div>
      </div>

      {/* Decision Engine Panel (Shows only when optimization triggers or is active) */}
      {decision && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-200 mb-6 bg-gradient-to-r from-white to-blue-50">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><ShieldCheck className="text-blue-600" /> Optimization Decision Engine</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="md:col-span-1">
              <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Candidate Actions</h3>
              <div className="space-y-2">
                {decision.candidates.map((c: any) => (
                  <div key={c.id} className={`p-2 rounded border text-sm flex justify-between items-center ${c.id === decision.selected.id ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-white border-slate-200 text-slate-600'}`}>
                    <span>{c.name}</span>
                    <span className="font-mono font-bold text-xs">Score: {c.score.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-1">
              <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Counterfactual Simulation</h3>
              <div className="space-y-3">
                {decision.counterfactuals.map((cf: any, i: number) => (
                  <div key={i} className="p-3 bg-white rounded border border-slate-200 text-xs">
                    <p className="font-bold text-slate-700 mb-1 border-b pb-1">IF: {cf.name}</p>
                    <div className="grid grid-cols-2 gap-1 text-slate-600">
                      <span>Resp: {cf.resp.toFixed(0)}ms</span>
                      <span>DB: {cf.db.toFixed(0)}ms</span>
                      <span>CPU: {cf.cpu.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-1 flex flex-col justify-center">
               <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Selected Action & Rationale</h3>
               <div className="bg-white p-4 rounded-xl border-l-4 border-l-blue-600 shadow-sm">
                 <p className="text-lg font-black text-slate-800 mb-2">{decision.selected.name}</p>
                 <p className="text-sm text-slate-600 italic leading-relaxed">
                   "{decision.reason}"
                 </p>
               </div>
            </div>

          </div>
        </div>
      )}

      {/* Main Charts & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Charts */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart3 size={20} className="text-slate-500" /> Performance Telemetry</h2>
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" hide />
                <YAxis yAxisId="left" tick={{fontSize: 12}} width={40} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} width={40} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="traffic_volume" stroke="#3b82f6" strokeWidth={2} name="Traffic" dot={false} isAnimationActive={false} />
                <Line yAxisId="right" type="monotone" dataKey="response_time" stroke="#ef4444" strokeWidth={2} name="Response (ms)" dot={false} isAnimationActive={false} />
                <Line yAxisId="left" type="monotone" dataKey="cpu_utilization" stroke="#f59e0b" strokeWidth={2} name="CPU %" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <h2 className="text-md font-bold mb-3 flex items-center gap-2 mt-8"><ShieldCheck size={18} className="text-slate-500" /> Optimization History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs uppercase bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-3 rounded-tl-lg">Time</th>
                  <th className="p-3">Bottleneck</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Expected</th>
                  <th className="p-3">Actual</th>
                  <th className="p-3 rounded-tr-lg">Result</th>
                </tr>
              </thead>
              <tbody>
                {optHistory.length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-center text-slate-400">No optimizations recorded yet.</td></tr>
                ) : (
                  optHistory.map((h, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="p-3 font-mono">{h.time}</td>
                      <td className="p-3 font-bold text-red-600">{h.bottleneck}</td>
                      <td className="p-3 font-medium text-slate-800">{h.action}</td>
                      <td className="p-3">{h.expected}</td>
                      <td className="p-3 font-bold">{h.actual}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${h.result === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {h.result}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel: Controls & Logs & Model Info */}
        <div className="space-y-6">
          
          {/* Demo Controls */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold uppercase text-slate-500 mb-3 flex items-center gap-2"><Play size={16} /> Load Generator</h2>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => setScenarioAndLog("NORMAL")} className={`px-4 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${scenario === "NORMAL" ? "bg-green-50 border-green-200 text-green-700" : "bg-white border-slate-200 hover:bg-slate-50"}`}>
                Normal Load
              </button>
              <button onClick={() => setScenarioAndLog("HIGH_TRAFFIC")} className={`px-4 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${scenario === "HIGH_TRAFFIC" ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-slate-200 hover:bg-slate-50"}`}>
                High Traffic Spike
              </button>
              <button onClick={() => setScenarioAndLog("DATABASE_BOTTLENECK")} className={`px-4 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${scenario === "DATABASE_BOTTLENECK" ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-white border-slate-200 hover:bg-slate-50"}`}>
                Database Bottleneck
              </button>
              <button onClick={() => setScenarioAndLog("CPU_PRESSURE")} className={`px-4 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${scenario === "CPU_PRESSURE" ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-white border-slate-200 hover:bg-slate-50"}`}>
                CPU Pressure
              </button>
              <button onClick={() => {
                setScenario("NORMAL");
                setOptimization("NONE");
                setDecision(null);
                setPhase("OBSERVING");
                setPrediction(null);
                setHistory([]);
                setOptHistory([]);
                setMetrics({
                  traffic_volume: 100,
                  response_time: 200,
                  cpu_utilization: 30,
                  memory_utilization: 40,
                  db_query_time: 50,
                  active_users: 500,
                  system_load: 0.5,
                });
                stateRef.current = { 
                  phase: 'OBSERVING', 
                  warnings: 0, 
                  normals: 0, 
                  verifyTicks: 0, 
                  beforeMetrics: null, 
                  currentDecision: null, 
                  resetId: (stateRef.current.resetId || 0) + 1 
                };
                addLog("SYSTEM RESET");
              }} className="px-4 py-2 rounded-lg text-sm font-medium border bg-slate-100 hover:bg-slate-200 text-slate-700 mt-2 text-center flex justify-center items-center gap-2">
                <RefreshCw size={14} /> Force Reset System
              </button>
            </div>
          </div>

          {/* Event Log */}
          <div className="bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-800 text-green-400 font-mono text-xs h-64 overflow-y-auto">
            <h2 className="text-sm font-bold uppercase text-slate-400 mb-3 sticky top-0 bg-slate-900 pb-1">System Event Log</h2>
            <div className="space-y-2">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-slate-500 shrink-0">[{log.time}]</span>
                  <span className={log.msg.includes("HIGH") || log.msg.includes("DETECTED") || log.msg.includes("Guard") ? "text-yellow-400" : log.msg.includes("RECOVERY") || log.msg.includes("VERIFIED") ? "text-blue-400" : ""}>
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
