import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">ShortKit Dashboard</h1>
        <p className="mt-2 text-white/60">
          Welcome, {session?.user?.name || session?.user?.email}
        </p>
      </div>
    </div>
  );
}
