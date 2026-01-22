export function getUserId(): string {
  return localStorage.getItem('userId') || 'default_user'
}
