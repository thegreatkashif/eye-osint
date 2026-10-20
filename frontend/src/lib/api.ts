
const API_BASE =
  process.env.NEXT_PUBLIC_EYE_API_URL ?? "http://127.0.0.1:8000";

export type CaseStatus = "open" | "paused" | "closed";

export type Investigation = {
  id: number;
  title: string;
  description: string | null;
  status: CaseStatus;
  created_at: string;
  updated_at: string;
};

export type CreateInvestigation = {
  title: string;
  description?: string | null;
  status?: CaseStatus;
};

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Cannot reach EYE API. Check that FastAPI is running on port 8000.",
    );
  }

  if (!response.ok) {
    let message = `API request failed (${response.status})`;

    try {
      const body: { detail?: unknown } = await response.json();

      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (Array.isArray(body.detail)) {
        message = body.detail
          .map((item: { msg?: string }) => item.msg ?? "Validation error")
          .join("; ");
      }
    } catch {
      // Retain the HTTP error if the response isn't JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function listInvestigations(): Promise<Investigation[]> {
  return request<Investigation[]>("/api/v1/cases?limit=50");
}

export function createInvestigation(
  payload: CreateInvestigation,
): Promise<Investigation> {
  return request<Investigation>("/api/v1/cases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
