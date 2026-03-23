import { LoginSessionService } from '../../services/login-session.service';

 import { CookieService } from 'ngx-cookie-service';
import Swal from 'sweetalert2';
import { CifMenuBarComponent } from '../cif-menu-bar/cif-menu-bar.component';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';

 
 
import {
  Component, ElementRef, OnInit, ViewChild,
  inject, DestroyRef, ChangeDetectorRef, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: 'app-new-bookings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe,
    CifMenuBarComponent,
  ],
  templateUrl: './NewBookings.component.html',
  styleUrls: ['./NewBookings.component.scss'],
})
export class NewBookingsComponent implements OnInit {

  // ── DI ───────────────────────────────────────────────────────────────────────
  private readonly CIFwebService = inject(LpuCIFWebService);
  private readonly router        = inject(Router);
  private readonly cookieService = inject(CookieService);
  private readonly destroyRef    = inject(DestroyRef);
  private readonly cdr           = inject(ChangeDetectorRef);
  private readonly platformId    = inject(PLATFORM_ID);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // ── Lists ────────────────────────────────────────────────────────────────────
  InstrumentData:         any[] = [];
  InstrumentDataInactive: any[] = [];
  AnalysisData:           any[] = [];
  InstrumentsDuration:    any[] = [];
  Datagrid:               any[] = [];
  rows: any[] = [
    { InstrumentName: '', AnalysisIdx: '', Durationx: '', Chargesx: '',
      NoOfSamplex: '', TotalAmountx: '', Remarksx: '' }
  ];

  // ── Session fields ───────────────────────────────────────────────────────────
  UserRole:       any;
  UserId:         any;
  user_Email:     any;
  candidateName:  any;
  MobileNo:       any;
  supervisorName: any;
  departmentName: any;

  // ── Component-level state mirrors (no ngModel) ───────────────────────────────
  PriceValue:      any = '';
  Duration:        any = '';
  NumberOfSamples: any = '';
  totalAmount:     any = '';
  Remarks:         any = '';
  InstrumentName:  any = '';
  InstrumentId:    any;
  AnalysisId:      any;
  selectedId!:     number;
  selectedDuration!: string;
  SampleExcelSheet: any;

  disableBooking   = false;
  // ✅ FIX #2 — typed as boolean, initialised false — prevents NG0100
  loadingIndicator = false;
  isActive:        any;
  concatenatedInstrumentNames!: string;
  InActiveInstrumentIds!: string;
  Message          = '';
  serverUrl!:      string;
  TypeId           = 'CIF';
  currentStep      = 1;

  // File upload
  fileData!:      File;
  fileStatus!:    boolean;
  FileData!:      string;
  fileName!:      string;
  uploadEnabled!: boolean;

  paymentData:     any;
  private newDynamic: any = {};

  // ── Reactive Form ─────────────────────────────────────────────────────────────
  formdata = new FormGroup({
    InstrumentName: new FormControl('Select', Validators.required),
    AnalysisId:     new FormControl('Select', Validators.required),
    Duration:       new FormControl('Select', Validators.required),
    Charges:        new FormControl('',       Validators.required),
    NoOfSample:     new FormControl('',       Validators.required),
    TotalAmount:    new FormControl('',       Validators.required),
    Remarks:        new FormControl('',       Validators.required),
    ExcelData:      new FormControl('',       Validators.required),
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // ✅ FIX #1 — SSR guard: cookies and browser APIs only available in browser.
    //    On the server, cookieService.get() returns '' → JSON.parse('') throws.
    //    Skip ALL cookie access and API calls during SSR.
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/CIFSampleExcelSheets/';

    const raw = this.cookieService.get('InternalUserAuthData');

    // ✅ FIX #1b — also guard against empty / malformed cookie value
    if (!raw || raw.trim().length === 0) {
      Swal.fire({
        title: 'Session Expired',
        text: 'Please login again to continue.',
        icon: 'warning',
      }).then(() => this.router.navigate(['']));
      return;
    }

    try {
      const retrievedCookies = JSON.parse(raw);
      this.UserRole      = retrievedCookies.UserRole;
      this.UserId        = retrievedCookies.UserRole;
      this.user_Email    = retrievedCookies.EmailId;
      this.candidateName = retrievedCookies.CandidateName;
      this.MobileNo      = retrievedCookies.MobileNo;
    } catch {
      // Cookie data is corrupt — clear and redirect
      this.cookieService.delete('InternalUserAuthData');
      this.router.navigate(['']);
      return;
    }

    // ✅ FIX #2 — NG0100: setting loadingIndicator synchronously in ngOnInit
    //    mutates state after Angular's first CD pass, causing the
    //    "ExpressionChangedAfterItHasBeenCheckedError".
    //    Wrapping in Promise.resolve().then() defers the state mutation
    //    to AFTER the current CD cycle completes, then triggers a clean
    //    detectChanges() so the view stays consistent.
    Promise.resolve().then(() => {
      this.getInstrumentData();
      this.cdr.detectChanges();
    });
  }

  // ── Navigation ───────────────────────────────────────────────────────────────
  goToNextStep(): void { if (this.currentStep < 3) this.currentStep++; }
  prevStep():     void { if (this.currentStep > 1)  this.currentStep--; }
  nextStep():     void { if (this.currentStep < 2 && this.formdata.valid) this.currentStep++; }

  goToDetails(): void {
    this.Datagrid.length > 0
      ? this.goToNextStep()
      : alert('No tests added to view details.');
  }

  addRow(): void {
    this.rows.push({ InstrumentName: '', AnalysisIdx: '', Durationx: '',
                     Chargesx: '', NoOfSamplex: '', TotalAmountx: '', Remarksx: '' });
  }

  deleteRow(index: number): void {
    if (index > 0) {
      this.rows.splice(index, 1);
    } else {
      Swal.fire({ title: 'Not Allowed', text: 'At Least One Record is required!', icon: 'warning' });
    }
  }

  // ── API: Instruments ─────────────────────────────────────────────────────────
  getInstrumentData(): void {
    this.loadingIndicator = true;
    const startTime = Date.now();

    this.CIFwebService.GetInstrumentsDetails()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (response.item1?.length > 0) {
            this.InstrumentData         = response.item1;
            this.InstrumentDataInactive = response.item1.filter((i: any) => i.isActive === false);
            this.concatenatedInstrumentNames = this.InstrumentDataInactive
              .map((i: any) => i.instrumentName).join(' | ');
            this.InActiveInstrumentIds = this.InstrumentDataInactive
              .map((i: any) => i.instrumentId).join(' | ');
          } else {
            this.InstrumentData = [];
          }
          this.stopLoader(startTime);
        },
        error: err => { console.error(err); this.loadingIndicator = false; },
      });
  }

  // ── API: Analysis for instrument ─────────────────────────────────────────────
  GetInstrumentIDWiseAnalysisDetails(selectedId: number): void {
    this.loadingIndicator = true;
    const startTime = Date.now();

    this.CIFwebService.GetAnalysisDetails(selectedId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.AnalysisData = response.item1?.length > 0 ? response.item1 : [];
          this.stopLoader(startTime);
        },
        error: err => { console.error(err); this.loadingIndicator = false; },
      });
  }

  // ── API: Durations for analysis ──────────────────────────────────────────────
  getDurationData(AnalysisId: any): void {
    this.loadingIndicator = true;
    const startTime = Date.now();

    this.CIFwebService.GetAnalysisData(AnalysisId, this.UserId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.InstrumentsDuration = response.item1?.length > 0 ? response.item1 : [];
          this.stopLoader(startTime);
        },
        error: err => { console.error(err); this.loadingIndicator = false; },
      });
  }

  // ── Event: Instrument select ─────────────────────────────────────────────────
  getAllAnalysis(event: Event): void {
    this.Duration = this.AnalysisId = this.PriceValue = '';

    const selectElement        = event.target as HTMLSelectElement;
    const selectedValue        = selectElement.value;
    const dashIndex            = selectedValue.indexOf('-');
    const selectedInstrumentId = parseInt(selectedValue.substring(0, dashIndex), 10);
    this.InstrumentName        = selectedValue.substring(dashIndex + 1);
    this.SampleExcelSheet      = this.InstrumentData?.find(i => i.instrumentId === selectedInstrumentId);

    if (!selectedInstrumentId || !this.SampleExcelSheet) { return; }

    const inactiveInstrument = this.InstrumentDataInactive?.find(i => i.instrumentId === selectedInstrumentId);
    if (inactiveInstrument && this.InActiveInstrumentIds?.includes(selectedInstrumentId.toString())) {
      Swal.fire({
        title: 'This instrument is under Maintenance. You cannot proceed with this selection.',
        icon: 'error',
      }).then(() => window.location.reload());
      return;
    }

    this.selectedId   = selectedInstrumentId;
    this.InstrumentId = this.selectedId;
    this.testClick(this.SampleExcelSheet.sampleExcelSheetUrl);
    this.Message = 'A Format File is being Downloaded. You need to fill and upload this Excel sheet to send your requirements!';
    Swal.fire({ title: this.Message, icon: 'warning' });

    const selectedInstrument = this.InstrumentData?.find(i => i.instrumentId === selectedInstrumentId);
    if (selectedInstrument) {
      this.isActive = selectedInstrument.isActive;
      this.Duration = 'Other Cases';
      this.GetInstrumentIDWiseAnalysisDetails(this.selectedId);
    }
  }

  // ── Event: Analysis type select ──────────────────────────────────────────────
  setAnalysisId(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedValue = selectElement.value;
    const idx = Array.from(selectElement.options).findIndex(o => o.value === selectedValue);
    this.Duration = this.PriceValue = '';

    if (idx !== -1) {
      selectElement.selectedIndex = idx;
      this.selectedId = parseInt(selectedValue, 10);
      this.AnalysisId = this.selectedId;
      this.getDurationData(this.AnalysisId);
    }
  }

  // ── Event: Duration select → fetch price ────────────────────────────────────
  getPrice(event: Event): void {
    this.loadingIndicator = true;
    const startTime       = Date.now();
    this.NumberOfSamples  = '';
    this.totalAmount      = '';
    this.formdata.patchValue({ NoOfSample: '', TotalAmount: '' });

    const selectElement      = event.target as HTMLSelectElement;
    const selectedAnalysisId = selectElement.value;
    const selectedTypeName   = selectElement.options[selectElement.selectedIndex].text;

    if (selectedAnalysisId === 'Select') {
      this.loadingIndicator = false;
      return;
    }

    this.selectedDuration = selectedTypeName;

    this.CIFwebService.GetDuationAndPrice(selectedAnalysisId, this.UserRole, this.selectedDuration)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (response.item1?.length > 0) {
            const match = response.item1.find((item: any) => item.typeName === this.selectedDuration);
            if (match) {
              this.PriceValue = match.price;
              this.formdata.patchValue({ Charges: this.PriceValue });
              if (this.PriceValue === 'N/A' || this.PriceValue === 'NA') {
                this.disableBooking = true;
                Swal.fire({ title: 'This Test is not Allowed', text: 'Kindly proceed with some other test!', icon: 'warning' });
                setTimeout(() => this.formdata.reset(), 500);
              }
            }
          } else {
            this.AnalysisData = [];
          }
          this.stopLoader(startTime);
        },
        error: err => { console.error('Error:', err); this.loadingIndicator = false; },
      });
  }

  // ── Event: Sample count input ────────────────────────────────────────────────
  onSampleCountChange(event: Event): void {
    this.NumberOfSamples = (event.target as HTMLInputElement).value;
    this.calculateAmount();
    this.formdata.patchValue({ NoOfSample: this.NumberOfSamples });
  }

  calculateAmount(): void {
    const cost    = this.PriceValue !== 'N/A' ? parseInt(this.PriceValue, 10) : 0;
    const samples = parseInt(this.NumberOfSamples, 10) || 0;
    this.totalAmount = samples * cost;
    this.formdata.patchValue({ TotalAmount: this.totalAmount.toString() });
  }

  // ── Event: Remarks textarea ──────────────────────────────────────────────────
  onRemarksChange(event: Event): void {
    this.Remarks = (event.target as HTMLTextAreaElement).value;
    this.formdata.patchValue({ Remarks: this.Remarks });
  }

  // ── Add to bucket ─────────────────────────────────────────────────────────────
  Addtogrid(): void {
    if (this.formdata.valid) {
      this.newDynamic = {
        instrumentName:  this.InstrumentName,
        instrument:      this.InstrumentId,
        analysisId:      this.AnalysisId,
        Duration:        this.Duration,
        PriceValue:      this.PriceValue,
        NumberOfSamples: this.NumberOfSamples,
        totalAmount:     this.totalAmount,
        Remarks:         this.Remarks,
        UserEmailId:     this.user_Email,
      };
      this.Datagrid.push({ ...this.newDynamic });
      this.clear();
    }
  }

  clear(): void {
    this.formdata.patchValue({
      InstrumentName: 'Select',
      AnalysisId:     'Select',
      Duration:       'Select',
      Charges:        '',
      NoOfSample:     '',
      TotalAmount:    '',
      Remarks:        '',
    });
    this.Remarks         = '';
    this.PriceValue      = '';
    this.NumberOfSamples = '';
    this.totalAmount     = '';
    this.Message         = '';
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  deleteEntry(index: number): void { this.Datagrid.splice(index, 1); }

  getTotalPayment(): number {
    return this.Datagrid.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  }

  // ── Save all records ─────────────────────────────────────────────────────────
  saveAllRecords(): void {
    this.loadingIndicator = true;
    const startTime = Date.now();

    const apiCalls = this.Datagrid.map(item => {
      const formData = new FormData();
      formData.append('InstrumentId',    item.instrument.toString());
      formData.append('analysisId',      item.analysisId.toString());
      formData.append('Duration',        item.Duration);
      formData.append('AnalysisCharges', item.PriceValue.toString());
      formData.append('NoOfSamples',     item.NumberOfSamples.toString());
      formData.append('TotalCharges',    item.totalAmount.toString());
      formData.append('Remarks',         item.Remarks);
      formData.append('UserEmailId',     this.user_Email);
      formData.append('FilePath',        this.fileName);
      formData.append('File',            this.FileData);
      return this.CIFwebService.addBookingSlot(formData);
    });

    forkJoin(apiCalls)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: results => {
          let allSuccess = true;
          (results as any[]).forEach(data => {
            const msg = data.item1[0]['msg'];
            if (msg !== 'OK') {
              allSuccess = false;
              Swal.fire({ title: 'Something went wrong', text: msg, icon: 'error' });
            }
          });
          if (allSuccess) {
            Swal.fire({
              title: 'Uploaded all Documents',
              text:  'All records have been uploaded successfully.',
              icon:  'success',
            }).then(() => this.router.navigateByUrl('ViewBookings'));
          }
          this.stopLoader(startTime);
        },
        error: () => {
          this.loadingIndicator = false;
          Swal.fire({ title: 'Error', text: 'An error occurred while saving the records.', icon: 'error' });
        },
      });
  }

  // ── Single submit (legacy path) ───────────────────────────────────────────────
  Onsubmit(): void {
    this.loadingIndicator = true;
    const startTime       = Date.now();
    const AnalysisCharge  = this.PriceValue === 'N/A' ? 0 : parseInt(this.PriceValue, 10);
    const TotalPrice      = this.totalAmount === 'NA'  ? 0 : parseInt(this.totalAmount, 10);

    const formData = new FormData();
    formData.append('InstrumentId',    this.InstrumentId);
    formData.append('UserEmailId',     this.user_Email);
    formData.append('AnalysisId',      this.AnalysisId);
    formData.append('AnalysisCharges', AnalysisCharge.toString());
    formData.append('NoOfSamples',     this.NumberOfSamples);
    formData.append('TotalCharges',    TotalPrice.toString());
    formData.append('Remarks',         this.Remarks);

    this.CIFwebService.addBookingSlot(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          const result = data.item1[0]['msg'];
          result === 'OK'
            ? Swal.fire({ title: 'Uploaded the Document', text: result, icon: 'success' })
            : Swal.fire({ title: 'Something went wrong', text: result, icon: 'error' });
          this.stopLoader(startTime);
        },
        error: err => { console.error(err); this.loadingIndicator = false; },
      });
  }

  // ── File handling ─────────────────────────────────────────────────────────────
  onFileSelected(event: Event): void {
    const reader = new FileReader();
    const target = event.target as HTMLInputElement;
    const file: File | null = (target.files as FileList)[0] ?? null;
    if (!file) { return; }

    if (file.size > 3_148_576) {
      Swal.fire({ title: 'File size exceeds 3MB. Please upload a smaller file.', text: 'Invalid File size', icon: 'warning' });
      target.value = '';
      return;
    }

    const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
    const activeFile: File = fileNameRegex.test(file.name) ? file : (() => {
      const validName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const modified  = new File([file], validName, { type: file.type });
      const dt        = new DataTransfer();
      dt.items.add(modified);
      target.files = dt.files;
      return modified;
    })();

    this.fileData = activeFile; this.fileStatus = true; this.uploadEnabled = true;
    reader.readAsDataURL(activeFile);
    reader.onload = () => {
      const parts   = (reader.result as string).split(',');
      this.FileData = parts[1];
      this.fileName = activeFile.name;
    };
  }

  // ── Download ──────────────────────────────────────────────────────────────────
  testClick(a: any): void { this.onDownloadFile(this.serverUrl + a); }

  DownloadFormat(a: any): void {
    if (!a) { return; }
    this.SampleExcelSheet    = this.InstrumentData?.find(i => i.instrumentId === a);
    const inactiveInstrument = this.InstrumentDataInactive?.find(i => i.instrumentId === a);
    if (inactiveInstrument && this.InActiveInstrumentIds?.includes(a.toString())) {
      Swal.fire({
        title: 'This instrument is under Maintenance. You cannot proceed with this selection.',
        icon: 'error',
      }).then(() => window.location.reload());
      return;
    }
    this.selectedId   = a;
    this.InstrumentId = this.selectedId;
    this.testClick(this.SampleExcelSheet?.sampleExcelSheetUrl);
  }

  onDownloadFile(remoteUrl: string): void {
    Swal.fire({ title: 'Downloading...', didOpen: () => { Swal.showLoading(null); } });
    this.CIFwebService.downloadFile(remoteUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob: Blob) => {
          const url  = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href  = url;
          link.download = remoteUrl.split('/').pop() || 'Document.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          Swal.close();
        },
        error: async (err) => {
          Swal.close();
          if (err.error instanceof Blob) {
            const msg = JSON.parse(await err.error.text());
            Swal.fire('Error', msg.message || 'Download failed', 'error');
          } else {
            Swal.fire('Error', 'Could not connect to the server', 'error');
          }
        },
      });
  }

  // ── Payment ───────────────────────────────────────────────────────────────────
  VerifyData(BookingCase: any): void {
    const formData = new FormData();
    formData.append('BookingId',     BookingCase.analysisId);
    formData.append('InstrumentId',  BookingCase.instrument);
    formData.append('CandidateName', this.candidateName);
    formData.append('Amount',        BookingCase.PriceValue);
    formData.append('Type',          this.TypeId);
    formData.append('UserEmailId',   this.user_Email);
    formData.append('MobileNo',      this.MobileNo);
    formData.append('FacultyCode',   this.user_Email);

    forkJoin({ payment: this.CIFwebService.MakePaymentforTest(formData) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results: any) => {
          const url = results?.payment?.item1?.[0]?.url;
          url?.length > 0
            ? (window.location.href = url)
            : Swal.fire({ title: 'Error Occurred, Try Again Later', text: 'Payment URL not found!', icon: 'error' });
        },
        error: (err: any) => {
          console.error(err);
          Swal.fire({ title: 'Error', text: 'Payment Gateway Failed!', icon: 'error' });
        },
      });
  }

  processPayment(): void { /* reserved */ }

  // ── Shared loader helper ──────────────────────────────────────────────────────
  private stopLoader(startTime: number): void {
    const remaining = Math.max(1000 - (Date.now() - startTime), 0);
    setTimeout(() => {
      this.loadingIndicator = false;
      // ✅ Manually notify Angular CD after async timer resolves
      //    to keep the view in sync without NG0100
      this.cdr.detectChanges();
    }, remaining);
  }
}