import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Parse error response and return a clean, user-friendly message
async function parseErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  
  // Try to parse as JSON and extract the error message
  try {
    const json = JSON.parse(text);
    // Handle common error response formats
    if (json.error) return json.error;
    if (json.message) return json.message;
    if (typeof json === 'string') return json;
  } catch {
    // Not JSON, use the text directly if it's meaningful
    if (text && text.length < 200) return text;
  }
  
  // Fallback to status text
  return res.statusText || 'Something went wrong';
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const message = await parseErrorMessage(res);
    throw new Error(message);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

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
