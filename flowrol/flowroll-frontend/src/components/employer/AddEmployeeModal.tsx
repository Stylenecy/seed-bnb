"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploadCloud, Plus, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";
import { flowLog } from "@/lib/utils";
import type { StagingRow } from "@/types";
import StagingRowItem from "./StagingRowItem";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: bigint;
  onConfirm: (employees: any[]) => void;
}

export function AddEmployeeModal({
  isOpen,
  onClose,
  onConfirm,
}: AddEmployeeModalProps) {
  const [rows, setRows] = useState<StagingRow[]>([
    {
      id: crypto.randomUUID(),
      identifier: "",
      username: null,
      address: null,
      salary: "",
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // const handleDownloadTemplate = () => {
  //     try {
  //       const csvContent =
  //         "Wallet Address or .init Name,Salary (USDC)\n0xc3235B99Bdf0F12e793BcA9B83A8BAD88E06C8B3,500\nlanre.init,400.50\n0x1d011983F10E491662dd1eA8Af0D6d6213B76A85,100\n0x8EA11de1130aA63aD0CD553B580fe0ca16C6fE06,350\nstonydriller.init,550";

  //       // Removed trailing semicolon in MIME type to prevent mobile OS parsing errors
  //       const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  //       const url = URL.createObjectURL(blob);

  //       const link = document.createElement("a");
  //       link.href = url;
  //       link.download = "flowroll_team_template.csv";

  //       // Ensure the element is completely invisible before appending
  //       link.style.display = "none";
  //       document.body.appendChild(link);

  //       link.click();

  //       document.body.removeChild(link);
  //       URL.revokeObjectURL(url);

  //       toast.success("Template downloaded!");
  //     } catch (error) {
  //       console.error("Template download error:", error);
  //       toast.error("Failed to download template. Please try again.");
  //     }
  //   };

const handleDownloadTemplate = async () => {
    try {
      const csvContent =
        "Wallet Address,Salary (USDC)\n0xc3235B99Bdf0F12e793BcA9B83A8BAD88E06C8B3,500\n0x1d011983F10E491662dd1eA8Af0D6d6213B76A85,100\n0x8EA11de1130aA63aD0CD553B580fe0ca16C6fE06,350";

      const fileName = "flowroll_team_template.csv";
      const file = new File([csvContent], fileName, {
        type: "text/csv;charset=utf-8",
      });

      const ua = navigator.userAgent;
      
      // Android webviews usually have 'wv' in the user agent string
      const isAndroidWebview = /wv\.|\.wv/i.test(ua) || /Version\/4\.0 Chrome/i.test(ua);
      
      // iOS webviews typically lack the word 'Safari', unlike the actual Safari/Chrome apps
      const isIOSWebview = /iPhone|iPad|iPod/i.test(ua) && !/Safari/i.test(ua);
      
      // Explicit fallback for known wallet apps
      const isExplicitWalletApp = /MetaMask|Trust|Phantom|TokenPocket/i.test(ua);

      const isInAppWalletBrowser = isAndroidWebview || isIOSWebview || isExplicitWalletApp;

      if (isInAppWalletBrowser) {
        toast.info(
          "Downloads are restricted inside this wallet app. Please open Flowroll in your device's browser with a wallet extension installed to download the template.",
          { duration: 6000 }
        );
        return;
      }

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "Flowroll Team Template",
          });
          toast.success("Template saved!");
          return;
        } catch (shareError: any) {
          if (shareError.name === "AbortError") return;
        }
      }

      const url = window.URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.target = "_blank";
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 1000);

      toast.success("Template downloaded!");
    } catch (error: any) {
      console.error("Template download error:", error);
      toast.error("Failed to handle template.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a valid .csv file");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      let skippedCount = 0;

      const parsedRows = text
        .split(/\r?\n/)
        .reduce<StagingRow[]>((acc, line) => {
          if (!line.trim() || /address|salary/i.test(line)) return acc;

          const [id, sal] = line.split(",");
          if (id && sal) {
            const cleanId = id.trim();
            const isInit = cleanId.toLowerCase().endsWith(".init");
            const isEth = cleanId.startsWith("0x") && cleanId.length === 42;

            acc.push({
              id: crypto.randomUUID(),
              identifier: cleanId,
              username: isInit ? cleanId : null,
              address: isEth ? cleanId : null,
              salary: sal.trim(),
            });
          } else {
            skippedCount++;
          }
          return acc;
        }, []);

      if (parsedRows.length > 0) {
        setRows((prev) => {
          const isFirstEmpty =
            prev.length === 1 && !prev[0].identifier && !prev[0].salary;
          return isFirstEmpty ? parsedRows : [...prev, ...parsedRows];
        });
        toast.success(`Extracted ${parsedRows.length} employees from CSV`);
      } else {
        toast.error("No valid data found in CSV");
      }

      if (skippedCount > 0)
        toast.warning(`Skipped ${skippedCount} malformed rows`);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    reader.readAsText(file);
  };

  const addRow = () =>
    setRows([
      ...rows,
      {
        id: crypto.randomUUID(),
        identifier: "",
        username: null,
        address: null,
        salary: "",
      },
    ]);

  const removeRow = (id: string) => {
    if (rows.length > 1) setRows(rows.filter((row) => row.id !== id));
  };

  const updateInput = (id: string, value: string) => {
    setRows(
      rows.map((row) => {
        if (row.id !== id) return row;
        const clean = value.trim();
        const isInit = clean.toLowerCase().endsWith(".init");
        const isEth = clean.startsWith("0x") && clean.length === 42;
        return {
          ...row,
          identifier: value,
          username: isInit ? clean : null,
          address: isEth ? clean : null,
        };
      }),
    );
  };

  const updateSalary = (id: string, value: string) =>
    setRows(rows.map((r) => (r.id === id ? { ...r, salary: value } : r)));

  const handleResolveAddress = useCallback((id: string, address: string) => {
    setRows((curr) => curr.map((r) => (r.id === id ? { ...r, address } : r)));
  }, []);

  const validationState = useMemo(() => {
    const addressCounts: Record<string, number> = {};
    let emptyCount = 0;
    let hasIncomplete = false;
    let hasInvalidSalary = false;

    rows.forEach((r) => {
      const idEmpty = !r.identifier.trim();
      const salEmpty = !r.salary.trim();

      if (idEmpty && salEmpty) {
        emptyCount++;
        return;
      }

      if (
        (!idEmpty && !r.address) ||
        (r.address && salEmpty) ||
        (idEmpty && !salEmpty)
      )
        hasIncomplete = true;
      if (!salEmpty && (isNaN(Number(r.salary)) || Number(r.salary) <= 0))
        hasInvalidSalary = true;

      if (r.address?.length === 42) {
        const addr = r.address.toLowerCase();
        addressCounts[addr] = (addressCounts[addr] || 0) + 1;
      }
    });

    const hasDuplicates = Object.values(addressCounts).some((c) => c > 1);
    const isCompletelyEmpty = emptyCount === rows.length;
    const isValid =
      !isCompletelyEmpty &&
      !hasIncomplete &&
      !hasInvalidSalary &&
      !hasDuplicates;

    let errorMessage = null;
    if (hasIncomplete)
      errorMessage = "Ensure all employees have a resolved address and salary.";
    else if (hasInvalidSalary)
      errorMessage = "Salaries must be valid numbers greater than 0.";
    else if (hasDuplicates)
      errorMessage =
        "Duplicate addresses detected. Each employee must be unique.";

    return { isValid, errorMessage, addressCounts };
  }, [rows]);

  const handleConfirm = () => {
    if (!validationState.isValid) return;

    const validEmployees = rows
      .filter((r) => r.address && r.salary.trim())
      .map((r) => ({
        username: r.username || r.address,
        address: r.address as string,
        salary: r.salary,
      }));

    flowLog("Staging valid employees:", validEmployees);
    onConfirm(validEmployees);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[95vw] sm:max-w-4xl p-0 sm:p-4 bg-white dark:bg-[#0a0c10] border-slate-200 dark:border-slate-800 rounded-3xl sm:rounded-[2rem] overflow-hidden shadow-xl shadow-slate-900/10 max-h-[90vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="bg-slate-50/50 dark:bg-slate-900/20 px-4 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row justify-between items-start gap-4 shrink-0">
          <div>
            <DialogTitle className="text-xl sm:text-2xl text-slate-900 dark:text-white font-black tracking-tight">
              Add Team Members
            </DialogTitle>
            <p className="text-slate-500 dark:text-slate-400 mt-1 sm:mt-1.5 text-xs sm:text-sm max-w-md">
              Enter addresses manually or upload a CSV to batch add employees.
            </p>
          </div>

          <TooltipProvider delayDuration={200}>
            <div className="flex flex-row md:flex-col items-center md:items-end gap-2 w-full md:w-auto shrink-0 justify-between md:justify-start">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 sm:h-10 text-xs sm:text-sm bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl font-medium transition-all cursor-pointer flex-1 md:flex-none"
                  >
                    <UploadCloud className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                    Upload CSV
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-none rounded-xl px-3 py-1.5 text-xs font-bold">
                  Upload a filled CSV to stage employees
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleDownloadTemplate}
                    className="bg-slate-100 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />{" "}
                    <span className="hidden sm:inline">CSV Template</span>
                    <span className="sm:hidden">Template</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-none rounded-xl px-3 py-1.5 text-xs font-bold">
                  Download the required CSV layout
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
        <div className="p-4 sm:p-8 flex-1 overflow-y-auto bg-white dark:bg-[#0a0c10] flex flex-col min-h-0">
          <div className="hidden md:grid grid-cols-[1fr_200px_40px] gap-4 mb-3 px-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Wallet Address
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Salary (USDC)
            </span>
            <span />
          </div>

          <div className="space-y-4 flex-1">
            {rows.map((row) => (
              <StagingRowItem
                key={row.id}
                row={row}
                updateInput={updateInput}
                updateSalary={updateSalary}
                removeRow={removeRow}
                onResolveAddress={handleResolveAddress}
                isDuplicate={
                  !!row.address &&
                  row.address.length === 42 &&
                  validationState.addressCounts[row.address.toLowerCase()] > 1
                }
              />
            ))}
          </div>

          <div className="mt-4 px-2 pb-4">
            <button
              onClick={addRow}
              className="group mx-auto mt-4 px-4 py-2 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-transparent hover:bg-teal-50/50 dark:hover:bg-teal-500/10 hover:border-teal-200 dark:hover:border-teal-500/30 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-teal-100 dark:group-hover:bg-teal-500/20 transition-colors duration-300">
                <Plus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:rotate-90 transition-all duration-300" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors duration-300">
                Add Another Employee
              </span>
            </button>
          </div>
        </div>

        {validationState.errorMessage && (
          <div className="bg-rose-50 dark:bg-rose-500/10 px-4 sm:px-8 py-3 border-t border-rose-100 dark:border-rose-500/20 flex items-start sm:items-center gap-2 text-rose-700 dark:text-rose-400 text-xs sm:text-sm font-medium shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
            <span>{validationState.errorMessage}</span>
          </div>
        )}

        <div className="bg-slate-50/50 dark:bg-slate-900/20 p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center justify-between w-full sm:w-auto gap-2.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Total Valid
            </span>
            <div className="flex items-center justify-center px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
              <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {rows.filter((r) => r.address && r.salary).length}
              </span>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-10 sm:h-12 px-4 sm:px-6 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-all flex-1 sm:flex-none text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!validationState.isValid}
              className="h-10 sm:h-12 px-4 sm:px-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-xs shadow-slate-900/10 transition-all font-black disabled:opacity-50 disabled:cursor-not-allowed border-none flex-[2] sm:flex-none text-xs sm:text-sm"
            >
              Confirm & Stage
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
