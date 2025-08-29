import { QueryClient } from "@tanstack/react-query";
export const API_BASE_URL = "https://zameed-backend.onrender.com";

export async function apiRequest(method: string, path: string, data?: unknown): Promise<Response> {
  const url = API_BASE_URL + path;
  const token = sessionStorage.getItem("token");
  const headers: Record<string, string> = {};

  let bodyContent: BodyInit | undefined;

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  else if (method === "POST") {
    headers["Content-Type"] = "application/json";
  }
  if (data) {
    if (data instanceof FormData) {
      bodyContent = data;
    } else {
      headers["Content-Type"] = "application/json";
      bodyContent = JSON.stringify(data);
    }
  }

  return fetch(url, {
    method,
    headers,
    body: bodyContent,
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 10000,
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});



