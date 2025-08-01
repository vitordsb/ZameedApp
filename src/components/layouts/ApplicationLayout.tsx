import { ReactNode } from "react";
import Navbar from "@/components/Navbar";

interface ApplicationLayoutProps {
  children: ReactNode;
}

export default function ApplicationLayout({ children }: ApplicationLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-6">
        {children}
      </main>
    </div>
  );
}
