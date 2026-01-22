/**
 * userId helper
 *
 * Centralized so hooks/services don't duplicate localStorage access.
 */

export function getUserId(): string {
  return localStorage.getItem('userId') || 'default_user'
}
