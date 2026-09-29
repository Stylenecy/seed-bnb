"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Sprout,
  Activity,
  Banknote,
  BookOpen,
  ShieldCheck,
  Building2,
  User,
  ChevronDown,
  Check,
  Menu,
  X,
} from "lucide-react";

import WalletConnectButton from "./WalletConnectButton";
import { NetworkSwitcher } from "./NetworkSwitcher";
import { useAuthStore } from "@/store/authStore";
import { useIdentity } from "@/hooks/identity/useIdentity";
import FlowrollLogo from "./FlowrollLogo";
import SmartHomeCTA from "./SmartHomeCTA";

export default function Navbar() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { role, setRole } = useAuthStore();
  const { isConnected } = useIdentity();

  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isHome = pathname === "/";
  const isOnboarding = pathname.startsWith("/onboarding");
  const isPortal = pathname.startsWith("/portal");
  const isEmployee =
    pathname.startsWith("/employee") || (role === "employee" && !isHome);
  const isEmployer =
    pathname.startsWith("/employer") || (role === "employer" && !isHome);
  const isApp = (isEmployer || isEmployee || isOnboarding) && !isHome;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsWorkspaceOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const employerLinks = [
    { name: "Dashboard", href: "/employer", icon: LayoutDashboard },
    { name: "Groups", href: "/employer/my-groups", icon: Users },
    { name: "Vault", href: "/vault", icon: Wallet },
    { name: "Autosave", href: "/claim", icon: Sprout },
  ];

  const employeeLinks = [
    { name: "Dashboard", href: "/employee", icon: Activity },
    { name: "Credit Hub", href: "/employee/credit-hub", icon: Banknote },
    { name: "Vault", href: "/vault", icon: Wallet },
    { name: "Autosave", href: "/claim", icon: Sprout },
  ];

  const homeLinks = [
    { name: "Features", href: "#features", icon: Activity },
    { name: "Security", href: "#security", icon: ShieldCheck },
    { name: "Docs", href: "#docs", icon: BookOpen },
  ];

  const activeLinks = isEmployer
    ? employerLinks
    : isEmployee
      ? employeeLinks
      : homeLinks;

  const handleSwitchWorkspace = (newRole: "employer" | "employee") => {
    setRole(newRole);
    setIsWorkspaceOpen(false);
    setIsMobileMenuOpen(false);
    router.push(`/${newRole}`);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-[50] w-full bg-white dark:bg-[#05070a]/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50"
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/" className="flex items-center group shrink-0">
            <FlowrollLogo />
          </Link>

          {!isApp ? (
            <span className="font-mono text-xl text-slate-900 dark:text-white font-black tracking-tighter uppercase hidden sm:block">
              Flowroll
            </span>
          ) : (
            <div>
              {!isOnboarding && (
                <div
                  className="flex items-center gap-2 sm:gap-3"
                  ref={dropdownRef}
                >
                  <div className="hidden sm:block w-[1.5px] h-6 bg-slate-300 dark:bg-slate-700 shrink-0 rounded-full" />
                  <div className="relative">
                    <button
                      onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors duration-200 group"
                    >
                      <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 group-hover:border-teal-500/30 transition-colors">
                        {role === "employer" ? (
                          <Building2 className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                    </button>

                    <AnimatePresence>
                      {isWorkspaceOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden py-1 z-[200]"
                        >
                          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/60 mb-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                              Switch Workspace
                            </p>
                          </div>

                          {(["employer", "employee"] as const).map((r) => (
                            <button
                              key={r}
                              onClick={() => handleSwitchWorkspace(r)}
                              className="flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {r === "employer" ? (
                                  <Building2
                                    className={`w-4 h-4 ${role === r ? "text-teal-500" : "text-slate-400"}`}
                                  />
                                ) : (
                                  <User
                                    className={`w-4 h-4 ${role === r ? "text-teal-500" : "text-slate-400"}`}
                                  />
                                )}
                                <span
                                  className={`capitalize font-medium ${role === r ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}
                                >
                                  {r}
                                </span>
                              </div>
                              {role === r && (
                                <Check className="w-4 h-4 text-teal-500" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!isOnboarding && !isPortal && (
          <nav className="hidden lg:flex flex-1 justify-center items-center gap-1 min-w-0">
            {activeLinks.map((link) => {
              const isActive = link.href.startsWith("#")
                ? false
                : link.href === "/" ||
                    link.href === "/employer" ||
                    link.href === "/employee"
                  ? pathname === link.href
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative px-3 xl:px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? "text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900/50"
                      : "text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  }`}
                >
                  <link.icon
                    className={`w-4 h-4 shrink-0 ${isActive ? "text-teal-500" : "text-slate-400"}`}
                  />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto lg:ml-0">
          <div className="hidden sm:block">
            <NetworkSwitcher />
          </div>

          {isApp && (
            <div className="hidden sm:block">
            </div>
          )}

          {isApp && (
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1" />
          )}

          <div className="">
            {isHome ? (
              <SmartHomeCTA />
            ) : isOnboarding && !isConnected ? null : (
              <WalletConnectButton />
            )}
          </div>

          {!isOnboarding && !isPortal && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden absolute left-0 w-full h-[calc(100dvh-72px)] bg-slate-50 dark:bg-[#05070a]/95 backdrop-blur-xl overflow-y-auto border-t border-slate-200/50 dark:border-slate-800/50"
          >
            <div className="px-2 py-8 flex flex-col gap-6 min-h-full">
              <section>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-3 pl-2">
                  Menu
                </p>
                <div className="flex flex-col bg-white/60 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-md p-2 ">
                  {activeLinks.map((link, i) => {
                    const isActive = link.href.startsWith("#")
                      ? false
                      : link.href === "/" ||
                          link.href === "/employer" ||
                          link.href === "/employee"
                        ? pathname === link.href
                        : pathname.startsWith(link.href);

                    return (
                      <motion.div
                        key={link.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`group flex items-center gap-4 px-2 py-3 rounded-md text-sm font-medium transition-all duration-300 ${
                            isActive
                              ? "bg-white dark:bg-white/10 shadow-xs border border-slate-200/50 dark:border-white/5 text-slate-900 dark:text-white"
                              : "text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 border border-transparent hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                              isActive
                                ? "bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-100 dark:border-emerald-500/30"
                                : "bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50"
                            }`}
                          >
                            <link.icon
                              className={`w-4 h-4 ${isActive ? "text-emerald-500 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}
                            />
                          </div>
                          {link.name}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </section>

              <section className="mt-auto pt-6">
                <div className="bg-white/60 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-md p-5 flex flex-col gap-5 ">
                  {isApp && (
                    <>
                      <div className="flex flex-col gap-5 px-1">
                        <div className="flex items-center justify-between">
                          <div>
                         <p className="text-[10px] font-semibold tracking-wide uppercase text-slate-700 dark:text-white">
                              Network
                            </p>
                            <p className="text-xs  text-slate-400">
                              Active Chain
                            </p>
                          </div>
                          <NetworkSwitcher />
                        </div>

                        <div className="h-px w-full bg-slate-200/60 dark:bg-slate-800/60" />

                        <div className="flex items-center justify-between">
                          <div>
                           <p className="text-[10px] font-semibold tracking-wide uppercase text-slate-700 dark:text-white">
                              Auto-Sign Tx
                            </p>
                            <p className="text-xs font-medium text-slate-400">
                              1-Click Protocol
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-px w-full bg-slate-200/60 dark:bg-slate-800/60" />
                    </>
                  )}
                  <div className="w-full flex justify-center pt-1">
                    {isHome ? (
                      <SmartHomeCTA />
                    ) : isOnboarding && !isConnected ? null : (
                      <WalletConnectButton />
                    )}
                  </div>
                </div>
              </section>

              <div className="h-6 shrink-0" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
