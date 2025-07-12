import { QueryClient, QueryFunction } from "@tanstack/react-query";

export const API_BASE_URL = "https://zameed-backend.onrender.com";

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const finalUrl = url.startsWith("https")
    ? url
    : API_BASE_URL + url;

  const token = sessionStorage.getItem("token");
  const res = await fetch(finalUrl, {
    method,
    headers: data ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const finalUrl = url.startsWith("https") ? url : API_BASE_URL + url;

    const res = await fetch(finalUrl, {
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    return await res.json();
  };

export const Logout = () => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("tokenExpiry");
}
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

