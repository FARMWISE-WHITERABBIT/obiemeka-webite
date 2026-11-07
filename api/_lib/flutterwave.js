export async function flutterwave(path, body) {
  const response = await fetch(`https://api.flutterwave.com/v3/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error('Flutterwave request failed')
  return response.json()
}

