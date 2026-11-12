import { healthResponseSchema } from "@devpulse/shared";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/apiClient";

function useApiHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => apiRequest("/health/live", healthResponseSchema),
    refetchInterval: 10_000,
  });
}

function ApiStatus() {
  const { data, error, isPending } = useApiHealth();

  if (isPending) {
    return <StatusBadge color="bg-gray-400" label="Checking API..." />;
  }
  if (error) {
    return <StatusBadge color="bg-red-500" label={`API unreachable: ${error.message}`} />;
  }
  return <StatusBadge color="bg-emerald-500" label={`API online, up ${data.uptimeSeconds}s`} />;
}

function StatusBadge({ color, label }: { color: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} aria-hidden="true" />
      <span role="status">{label}</span>
    </div>
  );
}

export function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900">DevPulse</h1>
      <p className="max-w-md text-gray-600">AI-powered engineering management platform.</p>
      <ApiStatus />
      <p className="text-xs text-gray-400">Phase 0: Foundation</p>
    </main>
  );
}
