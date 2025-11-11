export type User = { id: number; email: string; role: 'client'|'staff'|'admin'; garage_id?: number|null }

const TOKEN_KEY = 'mt_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}











