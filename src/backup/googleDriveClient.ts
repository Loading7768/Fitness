/**
 * Client-only Google Drive integration. No backend, no client secret — uses Google Identity
 * Services' public-client token flow with the least-privilege `drive.file` scope, so this app
 * can only see files it created itself, never the rest of the user's Drive.
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const SCOPE = 'https://www.googleapis.com/auth/drive.file'
const BACKUP_FOLDER_NAME = '健身紀錄備份'
const FOLDER_ID_CACHE_KEY = 'fitness-drive-folder-id'

interface TokenState {
  accessToken: string
  expiresAt: number
}

// Kept in memory only — never written to localStorage, so an XSS bug can't exfiltrate it at rest.
let tokenState: TokenState | null = null
let tokenClient: google.accounts.oauth2.TokenClient | null = null
let gisLoadPromise: Promise<void> | null = null
let pending: { resolve: (token: string) => void; reject: (err: Error) => void } | null = null

export function isBackupConfigured() {
  return Boolean(CLIENT_ID)
}

function loadGisScript(): Promise<void> {
  if (gisLoadPromise) return gisLoadPromise
  gisLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('無法載入 Google 登入服務'))
    document.head.appendChild(script)
  })
  return gisLoadPromise
}

async function getTokenClient(): Promise<google.accounts.oauth2.TokenClient> {
  if (tokenClient) return tokenClient
  if (!CLIENT_ID) throw new Error('尚未設定 VITE_GOOGLE_CLIENT_ID')
  await loadGisScript()
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: (resp) => {
      if (!pending) return
      if (resp.error) {
        pending.reject(new Error(resp.error))
      } else {
        tokenState = {
          accessToken: resp.access_token,
          expiresAt: Date.now() + Number(resp.expires_in) * 1000,
        }
        pending.resolve(resp.access_token)
      }
      pending = null
    },
  })
  return tokenClient
}

/** interactive=false tries a silent refresh (works if the user is still signed into Google in this browser). */
export async function requestAccessToken(interactive: boolean): Promise<string> {
  if (tokenState && tokenState.expiresAt > Date.now() + 30_000) {
    return tokenState.accessToken
  }
  const client = await getTokenClient()
  return new Promise((resolve, reject) => {
    pending = { resolve, reject }
    client.requestAccessToken({ prompt: interactive ? 'consent' : '' })
  })
}

export function isConnected() {
  return tokenState !== null && tokenState.expiresAt > Date.now()
}

export function disconnect() {
  if (tokenState) {
    google.accounts.oauth2.revoke(tokenState.accessToken, () => {})
  }
  tokenState = null
}

async function driveFetch(url: string, token: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Drive API ${res.status}: ${await res.text()}`)
  return res
}

export async function ensureBackupFolder(token: string): Promise<string> {
  const cached = localStorage.getItem(FOLDER_ID_CACHE_KEY)
  if (cached) return cached

  const query = encodeURIComponent(
    `name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  )
  const searchRes = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`,
    token,
  )
  const searchData = (await searchRes.json()) as { files: { id: string }[] }
  if (searchData.files.length > 0) {
    localStorage.setItem(FOLDER_ID_CACHE_KEY, searchData.files[0].id)
    return searchData.files[0].id
  }

  const createRes = await driveFetch('https://www.googleapis.com/drive/v3/files', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: BACKUP_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  })
  const created = (await createRes.json()) as { id: string }
  localStorage.setItem(FOLDER_ID_CACHE_KEY, created.id)
  return created.id
}

export interface DriveFile {
  id: string
  name: string
  createdTime: string
}

export async function listBackups(token: string, folderId: string): Promise<DriveFile[]> {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`)
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime)&orderBy=createdTime desc`,
    token,
  )
  const data = (await res.json()) as { files: DriveFile[] }
  return data.files
}

export async function uploadBackup(token: string, folderId: string, filename: string, json: string) {
  const boundary = 'fitness-backup-boundary'
  const metadata = { name: filename, parents: [folderId] }
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${json}\r\n` +
    `--${boundary}--`

  await driveFetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    },
  )
}

export async function downloadBackup(token: string, fileId: string): Promise<string> {
  const res = await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, token)
  return res.text()
}

export async function deleteBackup(token: string, fileId: string) {
  await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, token, { method: 'DELETE' })
}

export async function pruneOldBackups(token: string, folderId: string, keep = 5) {
  const files = await listBackups(token, folderId)
  const toDelete = files.slice(keep)
  for (const f of toDelete) {
    await deleteBackup(token, f.id)
  }
}
