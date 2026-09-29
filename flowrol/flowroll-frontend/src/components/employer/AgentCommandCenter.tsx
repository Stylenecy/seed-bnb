"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  Terminal,
  Server,
  X,
  Briefcase,
  GripHorizontal,
  CheckCircle2,
  ListTree,
  ArrowRight,
  Cpu,
  ServerOff,
} from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";

import { Button } from "../ui/button";
import { useAgentLogs, usePools } from "@/hooks/router/useRouterQueries";
import { useGroupDetails } from "@/hooks/payroll/usePayrollQueries";
import { useContractClient } from "@/hooks/useContractClient";
import { VaultCard } from "../yield/VaultCard";
import { useDisbursementRecord } from "@/hooks/dispatcher/useDispatcherQueries";
import { SmartTimeline } from "../yield/Smartline";
import { TreasuryHero } from "../yield/TreasuryHero";
import { MetricBox } from "../yield/MetricBox";
import { TabButton } from "../yield/TabButton";

// Component interfaces
interface RawLog {
  id: string;
  timestamp: string;
  message: string;
  type: string;
}

interface AgentMetrics {
  status: string;
  uptime: string;
  cycles: {
    total: number;
    success: number;
    failures: number;
  };
  config: {
    intervalMs: number;
  };
}

interface Props {
  groupId: bigint;
  onClose: () => void;
}

type ViewState = "portfolio" | "ledger" | "terminal";

export function AgentCommandCenter({ groupId, onClose }: Props) {
  // Data state
  const [rawLogs, setRawLogs] = useState<RawLog[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // UI state
  const [activeView, setActiveView] = useState<ViewState>("portfolio");
  const [isMobile, setIsMobile] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // DOM refs and animation controls
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const timelineEndRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Protocol queries
  const { address } = useContractClient();
  const { data: allPools } = usePools();
  const { data: groupDetails } = useGroupDetails(address, groupId);
  const { data: agentLogs } = useAgentLogs(groupDetails?.activeCycleId);
  const { data: disbursementRecord } = useDisbursementRecord(
    address,
    groupDetails?.activeCycleId,
  );

  // Responsive window sizing
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setDimensions({
        width: mobile ? window.innerWidth : window.innerWidth * 0.9,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Socket connection and metric polling
  useEffect(() => {
    const socket: Socket = io(process.env.NEXT_PUBLIC_AGENT_URL);

    socket.on("connect", () => setIsConnected(true));
    socket.on("agent-log", (newLog: RawLog) => {
      setRawLogs((prev) => [...prev, newLog].slice(-100));
    });

    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_URL}/status`);
        if (res.ok) setMetrics(await res.json());
      } catch (error) {
        console.error("Agent metrics fetch failed:", error);
      }
    };

    fetchMetrics();
    const metricInterval = setInterval(fetchMetrics, 3000);

    return () => {
      socket.disconnect();
      clearInterval(metricInterval);
    };
  }, []);

  // Auto-scroll logic for text-heavy views
  useEffect(() => {
    if (activeView === "terminal") {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    if (activeView === "ledger") {
      timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [rawLogs, agentLogs, activeView]);

  return (
    <div
      ref={constraintsRef}
      className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center lg:p-6"
    >
      <motion.div
        drag={!isMobile}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={constraintsRef}
        dragMomentum={false}
        style={{
          width: isMobile ? "100vw" : dimensions.width,
          height: isMobile ? "100dvh" : dimensions.height,
        }}
        className={`pointer-events-auto bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden relative border-slate-200 dark:border-slate-800 ${isMobile ? "rounded-none" : "rounded-2xl lg:rounded-3xl border"}`}
      >
        {/* Modal Header */}
        <div className="bg-slate-50 dark:bg-[#070b14] border-b border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
          {!isMobile && (
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="w-full py-1.5 flex justify-center cursor-grab active:cursor-grabbing hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            >
              <GripHorizontal className="w-5 h-5 text-slate-400 dark:text-slate-600" />
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 lg:px-6 py-3 sm:py-4 gap-4 sm:gap-0">
            {/* Title and Mobile Close Button Stack */}
            <div className="flex items-center justify-between w-full sm:w-auto shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <Server
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${isConnected ? "text-emerald-500 animate-pulse" : "text-rose-500"}`}
                />
                <span className="text-slate-900 dark:text-white font-bold text-sm tracking-tight">
                  Flowroll Agent
                </span>
              </div>

              <Button
                onClick={onClose}
                variant="ghost"
                className="sm:hidden p-1.5 -mr-2 h-auto text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* View Navigation */}
            <div className="flex items-center bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/50 overflow-x-auto no-scrollbar w-full sm:w-auto shrink-0">
              <TabButton
                active={activeView === "portfolio"}
                onClick={() => setActiveView("portfolio")}
                icon={<Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                label="Vaults"
              />
              <TabButton
                active={activeView === "ledger"}
                onClick={() => setActiveView("ledger")}
                icon={<ListTree className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                label="Ledger"
              />
              <TabButton
                active={activeView === "terminal"}
                onClick={() => setActiveView("terminal")}
                icon={<Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                label="Raw Logs"
              />
            </div>

            {/* Desktop Close Button */}
            <Button
              onClick={onClose}
              variant="ghost"
              className="hidden sm:flex p-2 h-auto text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </div>
        </div>

        {/* Main Application Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Engine Telemetry Sidebar */}
          <div
            className={`hidden lg:flex w-[280px] shrink-0 bg-slate-50/50 dark:bg-[#0b1120]/50 border-r border-slate-200 dark:border-slate-800 flex-col p-6 overflow-y-auto no-scrollbar z-10`}
          >
            <div className="flex flex-col gap-3 mb-8 shrink-0">
              <MetricBox
                label="Agent Status"
                value={isConnected ? "ONLINE" : "OFFLINE"}
                color={
                  isConnected
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }
              />
              <MetricBox
                label="Uptime"
                value={metrics ? metrics.uptime : "__"}
                color="text-sky-600 dark:text-sky-400"
              />
              <MetricBox
                label="Tick Rate"
                value={metrics ? `${metrics.config.intervalMs / 1000}s` : "__"}
                color="text-amber-600 dark:text-amber-400"
              />
              <MetricBox
                label="Successful Cycles"
                value={metrics ? metrics.cycles.success : "__"}
                color="text-slate-700 dark:text-slate-300"
              />
            </div>
          </div>

          {/* Dynamic Rendering Stage */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#070b14] relative">
            <AnimatePresence mode="wait">
              {/* Portfolio Grid View */}
              {activeView === "portfolio" && (
                <motion.div
                  key="portfolio"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute inset-0 p-4 sm:p-6 lg:p-8 overflow-y-auto no-scrollbar"
                >
                  <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col gap-1.5 sm:gap-2 min-w-0">
                      <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                          Portfolio Overview
                        </h2>

                        {disbursementRecord?.executed ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            Disbursed
                          </div>
                        ) : (
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest shadow-sm shrink-0 border transition-colors ${
                              isConnected
                                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {isConnected ? "Online" : "Offline"}
                          </div>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                        <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                        Vault allocation managed by Flowroll Agent.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveView("ledger")}
                      className="w-full sm:w-auto h-fit shrink-0 group flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs dark:shadow-none"
                    >
                      View Agent Ledger{" "}
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {groupDetails?.activeCycleId ? (
                    <TreasuryHero cycleId={groupDetails.activeCycleId} />
                  ) : (
                    <div></div>
                  )}

                  <div className="mt-8 sm:mt-10 mb-4 sm:mb-6 flex items-center gap-3 sm:gap-4">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 shrink-0">
                      Active Yield Vaults
                    </h3>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6 pb-8">
                    {allPools?.map((pool, index) => (
                      <VaultCard
                        key={pool.pool}
                        cycleId={groupDetails?.activeCycleId}
                        poolIndex={BigInt(index)}
                        poolEntry={pool}
                      />
                    ))}
                    {allPools?.length === 0 && (
                      <div className="col-span-full text-center py-12 sm:py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl text-slate-400 dark:text-slate-500 text-xs sm:text-sm">
                        No active vaults found. Waiting for agent deployment.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Smart Ledger View */}
              {activeView === "ledger" && (
                <motion.div
                  key="ledger"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute inset-0 p-4 sm:p-6 lg:p-10 overflow-y-auto no-scrollbar bg-slate-50 dark:bg-[#070b14]"
                >
                  <div className="max-w-3xl mx-auto px-4 sm:px-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-1.5 sm:mb-2 font-montserrat">
                      Execution Ledger
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-8 sm:mb-10 leading-relaxed">
                      A chronological audit of all smart contract executions
                      handled by the AI.
                    </p>
                    <SmartTimeline logs={agentLogs || []} isConnected={isConnected} />

                    <div ref={timelineEndRef} className="h-10" />
                  </div>
                </motion.div>
              )}

              {/* Raw Terminal Stream */}
              {activeView === "terminal" && (
                <motion.div
                  key="terminal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 p-4 sm:p-6 overflow-y-auto font-mono text-[11px] sm:text-[13px] leading-relaxed no-scrollbar bg-slate-50 dark:bg-black"
                >
                  {isConnected ? (
                    <div>
                      <div className="text-slate-500 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800/50">
                        Connection established. Tailing raw socket stream...
                      </div>
                      {rawLogs.map((log) => (
                        <div
                          key={log.id}
                          className="mb-1.5 flex gap-3 sm:gap-4 hover:bg-slate-100 dark:hover:bg-slate-900/50 px-2 py-1 -mx-2 rounded"
                        >
                          <span className="text-slate-400 dark:text-slate-600 shrink-0">
                            [{log.timestamp}]
                          </span>
                          <span
                            className={`break-words ${log.type === "success" ? "text-emerald-600 dark:text-emerald-400" : log.type === "error" ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"}`}
                          >
                            {log.message}
                          </span>
                        </div>
                      ))}
                      <div ref={terminalEndRef} />
                    </div>
                  ) : (
                    <div className="py-12 sm:py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] sm:rounded-[3rem] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-rose-100 dark:bg-rose-900/20 blur-2xl rounded-full scale-150 opacity-50" />
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-3xl flex items-center justify-center">
                          <ServerOff className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500 dark:text-rose-400" />
                        </div>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
                        Agent Disconnected
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-[280px] sm:max-w-xs leading-relaxed px-4">
                        The socket stream is currently inactive. Re-engage the
                        engine to view live execution logs.
                      </p>

                      <div className="mt-6 flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-widest">
                        System Offline
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
