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


  loading = signal(false);
  instruments = signal<any[]>([]);
  analyses = signal<any[]>([]);
  durations = signal<any[]>([]);
  dataGrid = signal<any[]>([]);
isReady = signal(false); // Prevents NG01052 error

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

 


















  loadInitialData(): void {
    this.loading.set(true);
    this.cifService.GetAllInstruments().subscribe({
      next: (res) => this.instruments.set(res.item1 || []),
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false) // Loader hidden here
    });
  }



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































































    































































