import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import "./styling/global.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes: cached data stays fresh and prevents duplicate network calls
      gcTime: 1000 * 60 * 15,   // 15 minutes in memory
      refetchOnWindowFocus: false, // Do not refetch on window/tab focus
      refetchOnMount: false,       // Use cache instantly on route navigation
      refetchOnReconnect: false,   // Do not spam on network reconnect
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
