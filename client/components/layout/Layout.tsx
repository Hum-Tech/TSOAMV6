import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 scroll-smooth">
          <div className="min-h-full w-full max-w-full">
            <div className="space-y-6 w-full">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
