"use client";

import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PositionCards } from "@/components/dashboard/PositionCards";
import { HealthGauge } from "@/components/dashboard/HealthGauge";
import { RepaymentProgress } from "@/components/dashboard/RepaymentProgress";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AllocationCard } from "@/components/dashboard/AllocationCard";
import { DashboardEmpty } from "@/components/dashboard/DashboardEmpty";
import { useAuth } from "@/lib/useAuth";

export default function DashboardPage() {
  const { hasPosition } = useAuth();

  return (
    <AppShell>
      {hasPosition ? (
        <div className="mx-auto w-full max-w-[1240px] space-y-8">
          <DashboardHeader />
          <PositionCards />
          <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
            <HealthGauge />
            <RepaymentProgress />
          </div>
          <AllocationCard />
          <ActivityFeed />
        </div>
      ) : (
        <DashboardEmpty />
      )}
    </AppShell>
  );
}
