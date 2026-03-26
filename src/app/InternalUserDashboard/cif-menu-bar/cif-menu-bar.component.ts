import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { LoginSessionService } from '../../services/login-session.service';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-cif-menu-bar',
  templateUrl: './cif-menu-bar.component.html',
  styleUrls: ['./cif-menu-bar.component.scss'],
  imports: [
    CommonModule,
  ],
})
export class CifMenuBarComponent implements OnInit {


  private readonly router = inject(Router);
  private readonly cookieService = inject(CookieService);
  private readonly AuthSession = inject(LoginSessionService);
  private readonly platformId = inject(PLATFORM_ID);


  UserSessionData: any;
  UserRole: any;
  User_Email: any;
  SupervisorName: any;
  DepartmentName: any;
  CandidateName: any;
  ShowBlink = true;
  isNavbarCollapsed = true;
  loadingIndicator = false;


  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) { return; }

    const raw = this.cookieService.get('InternalUserAuthData');

    if (!raw || raw.trim().length === 0) {
      Swal.fire({
        title: 'Session Expired',
        text: 'Please login again to continue.',
        icon: 'warning',
      }).then(() => this.router.navigate(['']));
      return;
    }

    try {
      const c = JSON.parse(raw);
      this.UserRole = c.UserRole;
      this.User_Email = c.EmailId;
      this.SupervisorName = c.SupervisorName;
      this.DepartmentName = c.DepartmentName;
      this.CandidateName = c.CandidateName;
    } catch {
      this.cookieService.delete('InternalUserAuthData');
      this.router.navigate(['']);
    }
  }


  goto(path: string): void {
    this.router.navigate(['/' + path]);
  }

  toggleNavbar(): void {
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
  }

  CheckUser(): boolean {
    return this.UserRole === '400000';
  }

  handleChangePassword(event: Event): void {
    if (this.CheckUser()) {
      event.preventDefault();
    } else {
      this.router.navigate(['/ChangePassword']);
    }
  }


  openSampleInstructions(): void {
    Swal.fire({
      title: 'Send Samples at the following Address:',
      html: `
        <address>
          <div class="contact-text">
            Central Instrumentation Facility (CIF)<br/>
            Lovely Professional University<br/>
            Block-38, Room No.106<br/>
            Jalandhar - Delhi G.T. Road,<br/>
            Phagwara, Punjab (India) - 144411<br/>
            Phone: <a href="tel:+911824444021">+91 1824-444021</a><br/>
            Email: cif@lpu.co.in
          </div>
        </address>`,
      icon: 'info',
    });
  }


  LogoutUser(): void {
    this.loadingIndicator = true;
    this.cookieService.delete('InternalUserAuthData');
    this.AuthSession.clearSession();

    setTimeout(() => {
      this.loadingIndicator = false;
      this.router.navigate([''], { replaceUrl: true });
    }, 500);
  }
}