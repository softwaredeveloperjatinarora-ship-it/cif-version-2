import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { UntypedFormBuilder } from '@angular/forms';
import swal from 'sweetalert2';
import { CookieService } from 'ngx-cookie-service';
import { LoginSessionService } from '../../services/login-session.service';
import { CommonModule } from '@angular/common';



@Component({
  standalone: true,
  selector: 'app-cif-menu-bar',
  templateUrl: './cif-menu-bar.component.html',
  styleUrls: ['./cif-menu-bar.component.scss'],
  imports:[CommonModule]
})
export class CifMenuBarComponent implements OnInit {

  UserSessionData: any;   UserRole: any;    user_Email: any;  supervisorName: any;  departmentName: any;  candidateName: any;
  constructor(
    public formBuilder: UntypedFormBuilder,
    private AuthSession: LoginSessionService,
    private router: Router, private cookieService: CookieService
  ) {
    const GetCookieData = this.cookieService.get('InternalUserAuthData');
    if (GetCookieData.length == 0) {
      swal.fire({
        title: 'Login Failed ',
        icon: 'warning',
      });
      this.router.navigate(['']);
    }
   }
 
openSampleInstructions() {
  swal.fire({
    title: 'Send Samples at the following Address :',
    html: `
         <address>
          <div class="contact-text">
           Central Instrumentation Facility (CIF) <br/>
          Lovely Professional University <br/>
          Block-38, Room No.106 <br/>
          Jalandhar - Delhi G.T. Road, <br/>
          Phagwara, Punjab (India) - 144411 <br/>
          Phone : <a href="tel:+911824444021">+91 1824-444021</a><br>
          Email : cif@lpu.co.in<br>
          </div>
         </address>`,
    icon: 'info'
  });   
  }
  showBlink = true;
  
 
  ngOnInit(): void {

    const GetCookieData = this.cookieService.get('InternalUserAuthData');
    const retrievedCookies = JSON.parse(GetCookieData);

    this.UserRole = retrievedCookies.UserRole ;//?.length > 0 ? retrievedCookies.userRole : 'Internal User';
    this.user_Email = retrievedCookies.EmailId;
    this.supervisorName = retrievedCookies.SupervisorName;
    this.departmentName = retrievedCookies.DepartmentName;
    this.candidateName = retrievedCookies.CandidateName;


  }
  handleChangePassword(event: Event) {
    if (this.CheckUser()) {
      event.preventDefault(); // Prevent link navigation
    } else {
      this.router.navigate(['/ChangePassword']);
    }
  }

  CheckUser(): boolean {
    return this.UserRole==400000 ? true : false;  
  }

  goto(val: any) {
    this.router.navigateByUrl(val);
  }
  isNavbarCollapsed: boolean = true;
  toggleNavbar(): void {
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
  }
  loadingIndicator: any;

  LogoutUser () {
    this.loadingIndicator = true;
  
    // Clear cookies and session immediately
    this.cookieService.delete('InternalUserAuthData');
    this.AuthSession.clearSession();
  
    // Wait 1 second before navigating (adjust delay as needed)
    setTimeout(() => {
      this.loadingIndicator = false;
      this.router.navigate(['Home'], { replaceUrl: true }).then(() => {        
        window.location.reload();
      });          
       
    }, 1000);
  }
  
}
