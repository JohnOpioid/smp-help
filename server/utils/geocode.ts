export async function geocodeAddress(address: string, apiKey: string): Promise<[number, number] | null> {
  try {
    const url = `https://geocode-maps.yandex.ru/1.x/?format=json&apikey=${encodeURIComponent(apiKey)}&geocode=${encodeURIComponent(address)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json() as any
    const members = data?.response?.GeoObjectCollection?.featureMember
    const posStr: string | undefined = members?.[0]?.GeoObject?.Point?.pos
    if (!posStr) return null
    const [lngStr, latStr] = posStr.split(' ')
    const lng = parseFloat(lngStr)
    const lat = parseFloat(latStr)
    if (Number.isFinite(lng) && Number.isFinite(lat)) return [lng, lat]
    return null
  } catch {
    return null
  }
}


