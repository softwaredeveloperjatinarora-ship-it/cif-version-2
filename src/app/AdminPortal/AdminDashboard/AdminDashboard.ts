import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import Swal from 'sweetalert2';

import { LoginSessionService } from '../../services/login-session.service';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,                          
  imports: [CommonModule],
  templateUrl: './AdminDashboard.html',
  styleUrl: './AdminDashboard.scss',
})
export class AdminDashboardComponent implements OnInit {

  private readonly cifWebService   = inject(LpuCIFWebService);
  private readonly authService     = inject(AuthService);
  private readonly authSession     = inject(LoginSessionService);
  private readonly router          = inject(Router);
  private readonly route           = inject(ActivatedRoute);
  private readonly cookieService   = inject(CookieService);

  readonly isNavbarCollapsed = signal<boolean>(true);
  readonly userRole          = signal<string>('Internal User');
  readonly userEmail         = signal<string>('');
  readonly supervisorName    = signal<string | null>(null);
  readonly departmentName    = signal<string>('');
  readonly candidateName     = signal<string>('');

  constructor() {
   
  }

  ngOnInit(): void {

    const cookieRaw = this.cookieService.get('AdminAuthData');
    if (cookieRaw) {
       const session = JSON.parse(cookieRaw);
    this.userRole.set(session.userRole?.length > 0 ? session.userRole : 'Internal User');
    this.userEmail.set(session.EmailId );
    this.supervisorName.set(session.SupervisorName );
    this.departmentName.set(session.DepartmentName );
    this.candidateName.set(session.CandidateName );
    }
    else
    {
       Swal.fire({ title: 'Login Failed', icon: 'warning' });
      this.router.navigate(['Home']);
    
    }
  }

  toggleNavbar(): void {
    this.isNavbarCollapsed.update(collapsed => !collapsed);
  }

  goto(route: string): void {
    this.router.navigateByUrl(route);
  }

  logoutUser(): void {
    this.cookieService.delete('AdminAuthData');
    this.authSession.clearSession();
    this.router.navigateByUrl('Home');
  }
}