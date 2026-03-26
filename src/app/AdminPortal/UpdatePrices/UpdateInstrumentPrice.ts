import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import swal from 'sweetalert2';

import { LoginSessionService } from '../../services/login-session.service';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';

 
import { AdminDashboardComponent } from '../AdminDashboard/AdminDashboard';

@Component({
  selector: 'app-admin-update-instrument-price',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,  AdminDashboardComponent],
  templateUrl: './UpdateInstrumentPrice.html',
  styleUrls: ['./UpdateInstrumentPrice.scss']
})

export class AdminUpdateInstrumentPrice implements OnInit {
  private document = inject(DOCUMENT);
  
  private fb = inject(FormBuilder);
  private cifService = inject(LpuCIFWebService);
  private cookieService = inject(CookieService);

  // Reactive State Signals
  loading = signal(false);
  instruments = signal<any[]>([]);
  analyses = signal<any[]>([]);
  durations = signal<any[]>([]);
  dataGrid = signal<any[]>([]);
isReady = signal(false); // Prevents NG01052 error
  // formdata!: FormGroup;
  userEmail = '';
formdata: FormGroup = this.fb.group({
        UserRoleS: ['Select', Validators.required],
        InstrumentName: ['Select', Validators.required],
        AnalysisId: ['Select', Validators.required],
        Duration: ['Select', Validators.required],
        Charges: [{ value: 0, disabled: true }], // Existing Price
        TotalAmount: [null, [Validators.required, Validators.min(1)]] // NewPrice field
    });
  ngOnInit(): void {
    this.isReady.set(true);
    this.loadInitialData();
  }

 
  // private initForm(): void {
  //   this.formdata = this.fb.group({
  //     userRole: ['Select', Validators.required],
  //     instrument: ['Select', Validators.required],
  //     analysisId: ['Select', Validators.required],
  //     duration: ['Select', Validators.required],
  //     currentPrice: [{ value: 0, disabled: true }],
  //     updatedPrice: [null, [Validators.required, Validators.min(1)]]
  //   });
  // }

  // private loadUserContext(): void {
  //   const authData = this.cookieService.get('AdminAuthData');
  //   if (authData) {
  //     this.userEmail = JSON.parse(authData).EmailId;
  //   }
  // }

  loadInitialData(): void {
    this.loading.set(true);
    this.cifService.GetAllInstruments().subscribe({
      next: (res) => this.instruments.set(res.item1 || []),
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false) // Loader hidden here
    });
  }

  // --- Cascade Change Handlers ---

  onUserRoleChange(): void {
    this.resetFields(['instrument', 'analysisId', 'duration']);
    this.analyses.set([]);
    this.durations.set([]);
  }

  onInstrumentChange(): void {
    const val = this.formdata.get('instrument')?.value;
    this.resetFields(['analysisId', 'duration']);
    
    if (val !== 'Select') {
      const id = val.split('-')[0];
      this.loading.set(true);
      this.cifService.GetAnalysisDetails(id).subscribe({
        next: (res) => this.analyses.set(res.item1 || []),
        error: () => this.loading.set(false),
        complete: () => this.loading.set(false)
      });
    }
  }

  onAnalysisChange(): void {
    const analysisId = this.formdata.get('analysisId')?.value;
    const role = this.formdata.get('userRole')?.value;
    this.resetFields(['duration']);

    if (analysisId !== 'Select' && role !== 'Select') {
      this.loading.set(true);
      this.cifService.GetAnalysisData(analysisId, role).subscribe({
        next: (res) => this.durations.set(res.item1 || []),
        error: () => this.loading.set(false),
        complete: () => this.loading.set(false)
      });
    }
  }

  onDurationChange() {
    const durationId = this.formdata.get('duration')?.value;
    const role = this.formdata.get('userRole')?.value;
    const durationObj = this.durations().find(d => d.analysisId == durationId);

    if (durationId !== 'Select' && durationObj) {
      this.loading.set(true);
      
      this.cifService.GetDuationAndPrice(durationId, role, durationObj.typeName).subscribe({
        next: (res) => {
          this.loading.set(false);
          const price = res.item1?.[0]?.price;
          
          if (price === 'N/A' || !price) {
            swal.fire({
              title: 'Not Available',
              text: 'Pricing logic not found for this selection. The page will refresh.',
              icon: 'warning',
              confirmButtonColor: '#ef7d00'
            }).then(() => {
              this.reloadPage();
            });
          } else {
            this.formdata.patchValue({ currentPrice: price });
          }
        },
        error: () => {
          this.loading.set(false);
          swal.fire('Error', 'Service communication failed.', 'error')
            .then(() => this.reloadPage());
        }
      });
    }
  }

  private reloadPage() {
    this.document.location.reload();
  }


  // onDurationChange() {
  //   const durationId = this.formdata.get('duration')?.value;
  //   const role = this.formdata.get('userRole')?.value;
    
  //   const durationObj = this.durations().find(d => d.analysisId == durationId);

  //   if (durationId !== 'Select' && durationObj) {
  //     this.loading.set(true); // Turn loader ON
      
  //     this.cifService.GetDuationAndPrice(durationId, role, durationObj.typeName).subscribe({
  //       next: (res) => {
  //         const price = res.item1?.[0]?.price;
  //         if (price === 'N/A' || !price) {
  //           swal.fire('Info', 'No price defined for this selection.', 'info');
  //           this.formdata.patchValue({ currentPrice: 0 });
  //         } else {
  //           this.formdata.patchValue({ currentPrice: price });
  //         }
  //         this.loading.set(false); 
  //       },
  //       error: (err) => {
  //         console.error(err);
  //         this.loading.set(false); 
  //         swal.fire('Error', 'Service unavailable', 'error');
  //       }
  //     });
  //   }
  // }

  private resetFields(fields: string[]): void {
    const patch: any = {};
    fields.forEach(f => patch[f] = 'Select');
    if (fields.includes('duration')) {
      patch.currentPrice = 0;
      patch.updatedPrice = null;
    }
    this.formdata.patchValue(patch);
  }

submitUpdate() {
        if (this.formdata.invalid) return;

        this.loading.set(true);
        const vals = this.formdata.getRawValue();
        
        const durationSelect = this.document.getElementById('durationSelect') as HTMLSelectElement;
        const typeName = durationSelect.options[durationSelect.selectedIndex].text;

        const formDataPayload = new FormData();
        formDataPayload.append('NewPrice', vals.TotalAmount);
        formDataPayload.append('UserRole', vals.UserRoleS);
        formDataPayload.append('AnalysisId', vals.AnalysisId);
        formDataPayload.append('TypeName', typeName);

        this.cifService.UpdateInstrumentPrice(formDataPayload).subscribe({
            next: (response: any) => {
                this.loading.set(false);
                swal.fire('Success', 'Instrument price updated successfully.', 'success')
                    .then(() => this.document.location.reload()); // Reload ONLY after OK
            },
            error: (err) => {
                this.loading.set(false);
                swal.fire('Update Failed', 'Could not update price. Please try again.', 'error');
            }
        });
    }
}

// export class AdminUpdateInstrumentPrice implements OnInit {
//   // Injectors
//   private fb = inject(FormBuilder);
//   private cifService = inject(LpuCIFWebService);
//   private cookieService = inject(CookieService);
//   private router = inject(Router);
//   private document = inject(DOCUMENT);

//   // Signals for Reactive State
//   loading = signal(false);
//   instruments = signal<any[]>([]);
//   analyses = signal<any[]>([]);
//   durations = signal<any[]>([]);
//   dataGrid = signal<any[]>([]);

//   // Form Group
//   formdata!: FormGroup;
//   userEmail = '';

//   ngOnInit(): void {
//     this.initForm();
//     this.loadUserContext();
//     this.loadInitialData();
//   }

//   private initForm(): void {
//     this.formdata = this.fb.group({
//       userRole: ['Select', Validators.required],
//       instrument: ['Select', Validators.required],
//       analysisId: ['Select', Validators.required],
//       duration: ['Select', Validators.required],
//       currentPrice: [{ value: 0, disabled: true }],
//       updatedPrice: [null, [Validators.required, Validators.min(1)]]
//     });
//   }

//   private loadUserContext(): void {
//     const authData = this.cookieService.get('authData');
//     if (authData) {
//       this.userEmail = JSON.parse(authData).EmailId;
//     }
//   }

//   async loadInitialData() {
//     this.loading.set(true);
//     this.cifService.GetAllInstruments().subscribe({
//       next: (res) => this.instruments.set(res.item1 || []),
//       complete: () => this.loading.set(false)
//     });
//   }

//   // --- Cascade Logic ---

//   onUserRoleChange(): void {
//     this.resetDownstream(['instrument', 'analysisId', 'duration']);
//     this.analyses.set([]);
//     this.durations.set([]);
//   }

//   onInstrumentChange(): void {
//     const val = this.formdata.get('instrument')?.value;
//     this.resetDownstream(['analysisId', 'duration']);
    
//     if (val !== 'Select') {
//       const id = val.split('-')[0];
//       this.loading.set(true);
//       this.cifService.GetAnalysisDetails(id).subscribe({
//         next: (res) => this.analyses.set(res.item1 || []),
//         complete: () => this.loading.set(false)
//       });
//     }
//   }

//   onAnalysisChange(): void {
//     const analysisId = this.formdata.get('analysisId')?.value;
//     const role = this.formdata.get('userRole')?.value;
//     this.resetDownstream(['duration']);

//     if (analysisId !== 'Select' && role !== 'Select') {
//       this.loading.set(true);
//       this.cifService.GetAnalysisData(analysisId, role).subscribe({
//         next: (res) => this.durations.set(res.item1 || []),
//         complete: () => this.loading.set(false)
//       });
//     }
//   }

//   onDurationChange(): void {
//     const durationId = this.formdata.get('duration')?.value;
//     const role = this.formdata.get('userRole')?.value;
//     const durationName = this.durations().find(d => d.analysisId == durationId)?.typeName;

//     if (durationId !== 'Select' && durationName) {
//       this.loading.set(true);
//       this.cifService.GetDuationAndPrice(durationId, role, durationName).subscribe({
//         next: (res) => {
//           const price = res.item1?.[0]?.price || 0;
//           if (price === 'N/A') {
//              swal.fire('Not Available', 'Pricing not defined for this role.', 'warning');
//              this.formdata.patchValue({ currentPrice: 0 });
//           } else {
//              this.formdata.patchValue({ currentPrice: price });
//           }
//         },
//         complete: () => this.loading.set(true)
//       });
//     }
//   }

//   private resetDownstream(fields: string[]): void {
//     const patch: any = {};
//     fields.forEach(f => patch[f] = 'Select');
//     if (fields.includes('duration')) {
//         patch.currentPrice = 0;
//         patch.updatedPrice = null;
//     }
//     this.formdata.patchValue(patch);
//   }

//   submitUpdate(): void {
//     if (this.formdata.valid) {
//       const raw = this.formdata.getRawValue();
//       this.dataGrid.update(prev => [...prev, { ...raw, email: this.userEmail }]);
//       swal.fire('Added', 'Price update staged successfully.', 'success');
//     }
//   }
// }