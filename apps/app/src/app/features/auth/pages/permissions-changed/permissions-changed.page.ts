
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-permissions-changed',
  templateUrl: './permissions-changed.page.html',
  styleUrls: ['./permissions-changed.page.scss'],
})
export class PermissionsChangedPage {

  
  currentRole = '';

  constructor(private router: Router) { }


  reloadMenu(): void {
    // TODO: Implement actual menu reload logic.
    // For now, it navigates to the home page.
    this.router.navigate(['/']);
  }

}
