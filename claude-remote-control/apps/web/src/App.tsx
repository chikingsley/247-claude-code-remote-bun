import { lazy, Suspense } from "react";
import { LoadingView } from "@/app/home/LoadingView";
import { Providers } from "@/components/Providers";
import { Toaster } from "@/components/ui/sonner";
import { usePathname } from "@/lib/router";

const HomePage = lazy(() => import("@/app/page"));
const ConnectPage = lazy(() => import("@/app/connect/page"));

function AppRoutes() {
  const pathname = usePathname();

  return (
    <Suspense fallback={<LoadingView />}>
      {pathname === "/connect" ? <ConnectPage /> : <HomePage />}
    </Suspense>
  );
}

export function App() {
  return (
    <Providers>
      <AppRoutes />
      <Toaster />
    </Providers>
  );
}
