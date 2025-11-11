export function isDark(): boolean {
  return document.documentElement.classList.contains('dark')
}

export function setDark(enabled: boolean): void {
  const root = document.documentElement
  if (enabled) root.classList.add('dark')
  else root.classList.remove('dark')
  localStorage.setItem('theme', enabled ? 'dark' : 'light')
}

export function initTheme(): void {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark') setDark(true)
}











