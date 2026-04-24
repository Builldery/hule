import { http } from '@/app/api/httpClient'

export async function getR2DownloadUrl(storageKey: string): Promise<string> {
  const res = await http<{ url: string }>(
    `/api/files/r2/url?key=${encodeURIComponent(storageKey)}`,
  )
  return res.url
}
