import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./AuthContext";
import { SocketProvider } from "./socket/SocketProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 10000,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <App />

          <ToastContainer
            position="top-right"
            autoClose={2500}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable
            theme="dark"
          />
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);