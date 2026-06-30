import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Poppins } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-datepicker/dist/react-datepicker.css";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { toggleSidebar } from "@/redux/slices/appSlice";
import Sidebar from "@/components/Sidebar";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { fetchCurrentStaff } from "@/redux/slices/authSlice";
import { fetchLeadStatuses } from "@/redux/slices/leadStatusSlice";
import { fetchLeadLabels } from "@/redux/slices/leadLabelSlice";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

function AppContent({ Component, pageProps }: AppProps) {
  const isSidebarOpen = useAppSelector((state) => state.app.isSidebarOpen);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathName = usePathname();
  const isLoginPage = pathName === "/login";
  const authStatus = useAppSelector((state) => state.auth.status);
  const leadStatusStatus = useAppSelector((state) => state.leadStatus.status);
  const leadLabelStatus = useAppSelector((state) => state.leadLabel.status);
  
  const hasDispatched = useRef(false);

  useEffect(() => {
    if (!isLoginPage && !hasDispatched.current) {
      hasDispatched.current = true;
      if (authStatus === 'idle') dispatch(fetchCurrentStaff());
      if (leadStatusStatus === 'idle') dispatch(fetchLeadStatuses());
      if (leadLabelStatus === 'idle') dispatch(fetchLeadLabels());
    }
  }, [authStatus, leadStatusStatus, leadLabelStatus, dispatch, isLoginPage]);

  // Page transition loader state
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsNavigating(true);
    const handleComplete = () => setIsNavigating(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  const getLabel = () => {
    if (pathName === "/") return "Dashboard";
    if (pathName === "/leads") return "Leads";
    if (pathName === "/leads/list") return "Leads List";
    if (pathName === "/leads/kanban") return "Leads Kanban";
    if (pathName === "/setup") return "Setup";
    if (pathName === "/tasks") return "Tasks";
    return "";
  };

  return (
    <div className={poppins.className}>
      <div className="flex min-h-screen bg-white">
        {!isLoginPage && (
          <Sidebar
            isOpen={isSidebarOpen}
            toggleSidebar={() => dispatch(toggleSidebar())}
          />
        )}
        <div
          className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${
            !isLoginPage ? (isSidebarOpen ? 'md:ml-64' : 'md:ml-20') : ''
          }`}
        >
          <main className="animate-in fade-in duration-300">
            {/* Only show header for non-login pages */}
            {!isLoginPage ? (
              <Header toggleSidebar={() => dispatch(toggleSidebar())} />
            ) : null}
            <div className={isLoginPage ? "p-0" : "p-4 md:p-6 relative min-h-[calc(100vh-80px)]"}>
              {isNavigating && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative flex h-16 w-16 items-center justify-center">
                      <div className="absolute h-16 w-16 animate-ping rounded-full bg-primary opacity-20"></div>
                      <div className="absolute h-12 w-12 animate-spin rounded-full border-4 border-[#e9d8f4] border-t-primary shadow-sm"></div>
                      <div className="h-6 w-6 animate-pulse rounded-full bg-primary shadow-md"></div>
                    </div>
                    <p className="text-xs font-bold tracking-widest text-primary animate-pulse uppercase">Loading...</p>
                  </div>
                </div>
              )}
              <Component {...pageProps} />
            </div>
          </main>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <AppContent Component={Component} pageProps={pageProps} />
    </Provider>
  );
}