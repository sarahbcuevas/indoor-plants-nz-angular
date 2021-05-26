import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (localStorage.getItem('currentUser')) {
      // logged in so return true
      return true;
    }

    // not logged in so redirect to login page with the return url
    let url = JSON.parse(JSON.stringify(state.url));
    if (url.includes('?') && url.includes('=')) {
      url = state.url.split('?')[0];
    }
    
    this.router.navigate(['/login'], { queryParams: { returnUrl: url }});
    return false;
  }
}
