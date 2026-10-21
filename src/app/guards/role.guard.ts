import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Route data එකේ { perm: 'users.manage' } එක නැත්නම් ඇතුළට දෙන්නේ නෑ.
export const permGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const perm = route.data?.['perm'] as string | undefined;

  if (!auth.isLoggedIn()) { router.navigate(['/login']); return false; }
  if (!perm || auth.has(perm)) return true;

  router.navigate(['/dashboard']);
  return false;
};
