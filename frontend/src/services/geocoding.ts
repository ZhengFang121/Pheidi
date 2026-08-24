import axios from 'axios'

interface ReverseGeocodingResponse {
  principalSubdivision?: string
  city?: string
  locality?: string
}

export async function getLocationLabel(latitude: number, longitude: number): Promise<string> {
  const response = await axios.get<ReverseGeocodingResponse>(
    'https://api.bigdatacloud.net/data/reverse-geocode-client',
    {
      params: {
        latitude,
        longitude,
        localityLanguage: 'zh-TW',
      },
    },
  )

  const city = response.data.principalSubdivision?.trim() || response.data.city?.trim()
  const district = response.data.locality?.trim()

  if (!city && !district) {
    throw new Error('反向地理編碼未回傳縣市或行政區')
  }

  if (!district || district === city) {
    return city || district || '位置無法辨識'
  }

  return `${city ?? ''}${district}`
}
