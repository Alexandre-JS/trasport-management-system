"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ContentArea } from "@/src/shared/layout/content-area";
import { Footer } from "@/src/shared/layout/footer";
import { Header } from "@/src/shared/layout/header";
import { MobileDrawer } from "@/src/shared/layout/mobile-drawer";
import { PageContainer } from "@/src/shared/layout/page-container";
import { Sidebar } from "@/src/shared/layout/sidebar";
import { cn } from "@/src/shared/utils/cn";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
      />
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200",
          "h-screen overflow-hidden",
          collapsed ? "lg:pl-20" : "lg:pl-72",
        )}
      >
        <Header onOpenMenu={() => setMobileOpen(true)} />
        <ContentArea>
          <PageContainer>{children}</PageContainer>
        </ContentArea>
        <Footer />
      </div>
    </div>
  );
}
