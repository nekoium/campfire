import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App.tsx";
import { wagmiConfig } from "./contract.ts";
import { monadTestnet } from "./config.ts";
import "./styles.css";

const queryClient = new QueryClient();

// Touch the chain so tree-shaking keeps it even if wagmi's connectors change.
void monadTestnet;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
