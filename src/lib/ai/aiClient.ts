export async function callAIEndpoint(endpoint: string, payload: Record<string, unknown>) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // Response was not valid JSON (e.g. HTML error page from Next.js)
    throw new Error(`API route ${endpoint} returned a non-JSON response (HTTP ${response.status}). The route may not exist or the server encountered an error.`);
  }

  if (!response.ok) {
    const errorMessage = data?.details || data?.error || `API error: ${response.status}`;
    const error = new Error(errorMessage);
    console.error('API Route Error:', { error: data?.error, details: data?.details });
    throw error;
  }

  return data;
}
