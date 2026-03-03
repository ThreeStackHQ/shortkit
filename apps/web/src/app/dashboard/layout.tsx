import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <DashboardSidebar
        userEmail={session.user.email}
        userName={session.user.name}
      />

      {/* Main content area — offset for desktop sidebar */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Spacer for mobile header */}
        <div className="lg:hidden h-14" />
        <DashboardHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
