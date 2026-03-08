const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

type ErrorRespuesta = {
  mensaje?: string;
};

async function requestJson<T>(url: string, options: RequestInit, token?: string): Promise<T> {
  const respuesta = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });

  const data = (await respuesta.json()) as ErrorRespuesta & T;

  if (!respuesta.ok) {
    throw new Error(data.mensaje ?? 'Ocurrió un error inesperado.');
  }

  return data;
}

export function getJson<T>(url: string, token?: string): Promise<T> {
  return requestJson<T>(url, { method: 'GET' }, token);
}

export function postJson<T>(url: string, body: unknown, token?: string): Promise<T> {
  return requestJson<T>(url, { method: 'POST', body: JSON.stringify(body) }, token);
}

export function putJson<T>(url: string, body: unknown, token?: string): Promise<T> {
  return requestJson<T>(url, { method: 'PUT', body: JSON.stringify(body) }, token);
}

export function deleteJson<T>(url: string, token?: string): Promise<T> {
  return requestJson<T>(url, { method: 'DELETE' }, token);
}
