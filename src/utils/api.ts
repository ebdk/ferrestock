const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export async function postJson<T>(url: string, body: unknown, token?: string): Promise<T> {
  const respuesta = await fetch(`${baseUrl}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });

  const data = (await respuesta.json()) as { mensaje?: string } & T;

  if (!respuesta.ok) {
    throw new Error(data.mensaje ?? 'Ocurrió un error inesperado.');
  }

  return data;
}
