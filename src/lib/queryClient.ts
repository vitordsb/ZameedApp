import { QueryClient } from "@tanstack/react-query";

export const API_BASE_URL = "https://zameed-backend.onrender.com";

export async function apiRequest(
  method: string,
  path: string,
  data?: unknown
): Promise<Response> {
  const url = API_BASE_URL + path;

  const token = sessionStorage.getItem("token");

  const headers: Record<string,string> = data ? { "Content-Type": "application/json" } : {};
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
}
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
