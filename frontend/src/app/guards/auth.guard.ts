import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

// ==========================================
// AUTHENTICATION GUARD
// ==========================================

export const authGuard: CanActivateFn = (route, state) => {

  const authService = inject(Auth);
  const router = inject(Router);

  // Check whether user is logged in
  if (authService.isLoggedIn()) {
    return true;
  }

  // Redirect to login if not authenticated
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};


// ==========================================
// ROLE-BASED GUARD
// ==========================================

export const roleGuard: CanActivateFn = (route) => {

  const authService = inject(Auth);
  const router = inject(Router);

  const userRole = authService.getRole();

  // Get allowed roles from route configuration
  const allowedRoles = route.data?.['roles'] as string[];

  // Check user role
  if (userRole && allowedRoles?.includes(userRole)) {
    return true;
  }

  // Redirect unauthorized users
  if (!userRole) {
    return router.createUrlTree(['/login']);
  }

  return router.createUrlTree(['/unauthorized']);
};