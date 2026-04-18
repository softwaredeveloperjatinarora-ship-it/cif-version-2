 
import {
  Component,
  OnInit,
  signal,
  computed,
  viewChild,
  ElementRef,
  inject,
  DestroyRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { finalize, forkJoin, Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { LoginSessionService } from '../../services/login-session.service';

 import { CookieService } from 'ngx-cookie-service';
import Swal from 'sweetalert2';
import { CifMenuBarComponent } from '../cif-menu-bar/cif-menu-bar.component';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service'; 




interface Instrument {
  instrumentId: number;
  instrumentName: string;
  isActive: boolean;
  sampleExcelSheetUrl: string;
}

interface Analysis {
  analysisId: number;
  analysisType: string;
}

interface DurationItem {
  analysisId: number;
  typeName: string;
  price: string;
}

interface GridEntry {
  instrumentName: string;
  instrument: number;
  analysisId: number;
  Duration: string;
  PriceValue: string;
  NumberOfSamples: number;
  totalAmount: number;
  Remarks: string;
  UserEmailId: string;
}

interface BookingForm {
  InstrumentName: string;
  AnalysisId: string;
  Duration: string;
  Charges: string;
  NoOfSample: string;
  TotalAmount: string;
  Remarks: string;
  ExcelData: string;
}




@Component({
  selector: 'app-new-bookings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe,  CifMenuBarComponent],
  templateUrl: './NewBookings.component.html',
  styleUrls: ['./NewBookings.component.scss'],
})
  
export class NewBookingsComponent implements OnInit {

  private readonly cifWebService = inject(LpuCIFWebService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly cookieService = inject(CookieService);
  private readonly destroyRef = inject(DestroyRef);


  readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');


  readonly loadingIndicator = signal(false);
  readonly currentStep      = signal(1);

  readonly instrumentData         = signal<Instrument[]>([]);
  readonly instrumentDataInactive = signal<Instrument[]>([]);
  readonly analysisData           = signal<Analysis[]>([]);
  readonly instrumentsDuration    = signal<DurationItem[]>([]);
  readonly datagrid               = signal<GridEntry[]>([]);


  readonly inactiveInstrumentIds = computed(() =>
    this.instrumentDataInactive().map(i => i.instrumentId).join(' | ')
  );


  priceValue      = '';
  numberOfSamples = '';
  totalAmount     = '';
  remarks         = '';
  message         = '';
  instrumentName  = '';
  instrumentId: number | null = null;
  analysisId: number | null   = null;
  selectedId      = 0;
  selectedDuration = '';
  isActive: boolean | null = null;
  disableBooking  = false;
  fileData!: File;
  fileDataBase64  = '';
  fileName        = '';
  uploadEnabled   = false;
  sampleExcelSheet: Instrument | undefined;


  userRole      = '';
  userId        = '';
  userEmail     = '';
  candidateName = '';
  mobileNo      = '';
  serverUrl     = '';
  typeId        = 'CIF';
  paymentData: unknown;


  formdata!: FormGroup<{
    InstrumentName: ReturnType<FormBuilder['control']>;
    AnalysisId:     ReturnType<FormBuilder['control']>;
    Duration:       ReturnType<FormBuilder['control']>;
    Charges:        ReturnType<FormBuilder['control']>;
    NoOfSample:     ReturnType<FormBuilder['control']>;
    TotalAmount:    ReturnType<FormBuilder['control']>;
    Remarks:        ReturnType<FormBuilder['control']>;
    ExcelData:      ReturnType<FormBuilder['control']>;
  }>;


  ngOnInit(): void {
    this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/CIFSampleExcelSheets/';

    const raw = this.cookieService.get('InternalUserAuthData');
    if (raw) {
      try {
        const cookie = JSON.parse(raw);
        this.userRole = cookie.UserRole;
        this.userId = cookie.UserRole;
        this.userEmail = cookie.EmailId;
        this.candidateName = cookie.CandidateName;
        this.mobileNo = cookie.MobileNo;
        this.buildForm();
        this.getInstrumentData();
      } catch (e) {
        console.error("Failed to parse JSON", e);
      }
    }
  }


  private buildForm(): void {
    this.formdata = this.fb.group({
      InstrumentName: this.fb.control('Select', Validators.required),
      AnalysisId:     this.fb.control('Select', Validators.required),
      Duration:       this.fb.control('Select', Validators.required),
      Charges:        this.fb.control('',       Validators.required),
      NoOfSample:     this.fb.control('',       Validators.required),
      TotalAmount:    this.fb.control('',       Validators.required),
      Remarks:        this.fb.control('',       Validators.required),
      ExcelData:      this.fb.control('',       Validators.required),
    }) as FormGroup;
  }


  goToNextStep(): void {
    if (this.currentStep() < 3) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  goToDetails(): void {
    if (this.datagrid().length > 0) {
      this.goToNextStep();
    } else {
      alert('No tests added to view details.');
    }
  }


  getInstrumentData(): void {
    this.withLoader(this.cifWebService.GetInstrumentsDetails()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response: { item1: any[]; }) => {
        if (response.item1?.length) {
          this.instrumentData.set(response.item1);
           const inactiveList = response.item1.filter((instrument: any) => instrument.isActive === false);
          this.instrumentDataInactive.set(inactiveList);
        } else {
          this.instrumentData.set([]);
        }
      },
      error: (err: any) => console.error(err),
    });
  }

  private getDurationData(id: number): void {
     this.cifWebService.GetAnalysisData(id, this.userRole).subscribe({
      next: response => {
        if (response.item1 && response.item1.length > 0) {
          this.instrumentsDuration.set(response.item1);
        }
        else {
            this.instrumentsDuration.set([]);
        }
      },
      error: (err: any) => console.error(err),
    });
  }

  private getInstrumentIDWiseAnalysisDetails(id: number): void {
    this.cifWebService.GetAnalysisDetails(id).subscribe({
      next: response => {
        if (response.item1 && response.item1.length > 0) {
        this.analysisData.set(response.item1?.length ? response.item1 : []);
        }
      },
      error: (err: any) => console.error(err),
    })
  }


  getAllAnalysis(event: Event): void {

    this.selectedDuration = this.analysisId?.toString() ?? '';
    this.priceValue = '';
    this.formdata.patchValue({ AnalysisId: 'Select', Duration: 'Select', Charges: '' });

    const select = event.target as HTMLSelectElement;
    const [idStr, ...nameParts] = select.value.split('-');
    const selId = parseInt(idStr, 10);
    if (!selId) return;

    this.instrumentName   = nameParts.join('-');
    this.sampleExcelSheet = this.instrumentData().find(i => i.instrumentId === selId);
    const inactive        = this.instrumentDataInactive().find(i => i.instrumentId === selId);

    if (inactive && this.inactiveInstrumentIds().includes(selId.toString())) {
      Swal.fire({
        title: 'This instrument is under Maintenance. You cannot proceed with this selection.',
        icon: 'error',
      }).then(() => window.location.reload());
      return;
    }

    this.selectedId  = selId;
    this.instrumentId = selId;

    this.testClick(this.sampleExcelSheet!.sampleExcelSheetUrl);
    this.message = 'A Format File is being Downloaded. You need to fill and upload this Excel sheet to send your requirements!';
    Swal.fire({ title: this.message, icon: 'warning' });

    const found = this.instrumentData().find(i => i.instrumentId === selId);
    if (found) {
      this.isActive = found.isActive;
      this.getInstrumentIDWiseAnalysisDetails(selId);
    }
  }

  setAnalysisId(event: Event): void {
    this.priceValue = '';
    const select = event.target as HTMLSelectElement;
    const idx = Array.from(select.options).findIndex(o => o.value === select.value);
    if (idx !== -1) {
      this.selectedId = parseInt(select.value, 10);
      this.analysisId = this.selectedId;
      this.getDurationData(this.analysisId);
    }
  }

  getPrice(event: Event): void {
    this.numberOfSamples = '';
    this.totalAmount     = '';

    const select    = event.target as HTMLSelectElement;
    const selId     = select.value;
    const typeName  = select.options[select.selectedIndex].text;

    if (selId === 'Select') return;

    this.selectedDuration = typeName;

    this.withLoader(
      this.cifWebService.GetDuationAndPrice(selId, this.userRole, typeName)
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response: { item1: any[]; }) => {
          if (response.item1?.length) {
            const match = response.item1.find((i: DurationItem) => i.typeName === this.selectedDuration);
            if (match) {
              this.priceValue = match.price;
              this.formdata.patchValue({ Charges: this.priceValue });

              if (this.priceValue === 'N/A' || this.priceValue === 'NA') {
                this.disableBooking = true;
                Swal.fire({
                  title: 'This Test is not Allowed',
                  text: 'Kindly proceed with some other test!',
                  icon: 'warning',
                });
                setTimeout(() => this.formdata.reset(), 500);
              }
            }
          } else {
            this.analysisData.set([]);
          }
        },
        error: (err: any) => console.error('Error:', err),
      });
  }


  calculateAmount(): void {
    const cost    = this.priceValue !== 'N/A' ? parseInt(this.priceValue, 10) : 0;
    const samples = parseInt(this.numberOfSamples, 10) || 0;
    this.totalAmount = (samples * cost).toString();
    this.formdata.patchValue({ NoOfSample: this.numberOfSamples, TotalAmount: this.totalAmount });
  }


  addToGrid(): void {
    if (!this.formdata.valid) return;

    const entry: GridEntry = {
      instrumentName: this.instrumentName,
      instrument:     this.instrumentId!,
      analysisId:     this.analysisId!,
      Duration:       this.selectedDuration,
      PriceValue:     this.priceValue,
      NumberOfSamples: parseInt(this.numberOfSamples, 10),
      totalAmount:    parseInt(this.totalAmount, 10),
      Remarks:        this.remarks,
      UserEmailId:    this.userEmail,
    };

    this.datagrid.update(grid => [...grid, entry]);
    this.clearForm();
  }

  deleteEntry(index: number): void {
    this.datagrid.update(grid => grid.filter((_, i) => i !== index));
  }

  getTotalPayment(): number {
    return this.datagrid().reduce((sum, item) => sum + item.totalAmount, 0);
  }

  private clearForm(): void {
    this.formdata.patchValue({
      InstrumentName: 'Select',
      AnalysisId:     'Select',
      Duration:       'Select',
      Charges:        '',
      NoOfSample:     '',
      TotalAmount:    '',
      Remarks:        '',
    });
    this.remarks         = '';
    this.priceValue      = '';
    this.numberOfSamples = '';
    this.totalAmount     = '';
    this.fileInput().nativeElement.value = '';
  }


  saveAllRecords(): void {
    const apiCalls = this.datagrid().map(item => {
      const fd = new FormData();
      fd.append('InstrumentId',    item.instrument.toString());
      fd.append('analysisId',      item.analysisId.toString());
      fd.append('Duration',        item.Duration);
      fd.append('AnalysisCharges', item.PriceValue.toString());
      fd.append('NoOfSamples',     item.NumberOfSamples.toString());
      fd.append('TotalCharges',    item.totalAmount.toString());
      fd.append('Remarks',         item.Remarks);
      fd.append('UserEmailId',     this.userEmail);
      fd.append('FilePath',        this.fileName);
      fd.append('File',            this.fileDataBase64);
      return this.cifWebService.addBookingSlot(fd);
    });

    this.withLoader(forkJoin(apiCalls)).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
        next: (results: any[]) => {
          const allOk = results.every((data: any) => data.item1[0]['msg'] === 'OK');
          if (allOk) {
            Swal.fire({
              title:  'Uploaded all Documents',
              text:   'All records have been uploaded successfully.',
              icon:   'success',
            }).then(() => this.router.navigateByUrl('ViewBookings'));
          } else {
            results.forEach((data: any) => {
              const msg = data.item1[0]['msg'];
              if (msg !== 'OK') {
                Swal.fire({ title: 'Something went wrong', text: msg, icon: 'error' });
              }
            });
          }
        },
        error: () =>
          Swal.fire({ title: 'Error', text: 'An error occurred while saving the records.', icon: 'error' }),
      });
  }


  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0] ?? null;
    if (!file) return;

    if (file.size > 3_148_576) {
      Swal.fire({ title: 'File size exceeds 3MB. Please upload a smaller file.', text: 'Invalid File size', icon: 'warning' });
      input.value = '';
      return;
    }

    const nameOk = /^[a-zA-Z0-9._-]+$/.test(file.name);
    const target  = nameOk ? file : new File([file], file.name.replace(/[^a-zA-Z0-9._-]/g, '_'), { type: file.type });

    if (!nameOk) {
      const dt = new DataTransfer();
      dt.items.add(target);
      input.files = dt.files;
    }

    this.fileData     = target;
    this.uploadEnabled = true;

    const reader      = new FileReader();
    reader.readAsDataURL(target);
    reader.onload     = () => {
      const [, b64]       = (reader.result as string).split(',');
      this.fileDataBase64 = b64;
      this.fileName        = target.name;
    };
  }


  downloadFormat(id: number): void {
    const sheet   = this.instrumentData().find(i => i.instrumentId === id);
    const inactive = this.instrumentDataInactive().find(i => i.instrumentId === id);

    if (inactive && this.inactiveInstrumentIds().includes(id.toString())) {
      Swal.fire({
        title: 'This instrument is under Maintenance.',
        icon: 'error',
      }).then(() => window.location.reload());
      return;
    }

    if (sheet) {
      this.instrumentId = id;
      this.testClick(sheet.sampleExcelSheetUrl);
    }
  }

  private testClick(url: string): void {
    this.onDownloadFile(this.serverUrl + url);
  }

  private onDownloadFile(remoteUrl: string): void {
    Swal.fire({ title: 'Downloading...', didOpen: () => Swal.showLoading(null) });

    this.cifWebService.downloadFile(remoteUrl).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (blob: Blob) => {
        const url  = URL.createObjectURL(blob);
        const link = Object.assign(document.createElement('a'), {
          href:     url,
          download: remoteUrl.split('/').pop() ?? 'Document.xlsx',
        });
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        Swal.close();
      },
      error: async err => {
        Swal.close();
        const msg = err.error instanceof Blob
          ? (JSON.parse(await err.error.text())).message ?? 'Download failed'
          : 'Could not connect to the server';
        Swal.fire('Error', msg, 'error');
      },
    });
  }


  verifyData(bookingCase: GridEntry): void {
    const fd = new FormData();
    fd.append('BookingId',    bookingCase.analysisId.toString());
    fd.append('InstrumentId', bookingCase.instrument.toString());
    fd.append('CandidateName', this.candidateName);
    fd.append('Amount',        bookingCase.PriceValue);
    fd.append('Type',          this.typeId);
    fd.append('UserEmailId',   this.userEmail);
    fd.append('MobileNo',      this.mobileNo);
    fd.append('FacultyCode',   this.userEmail);

    forkJoin({ payment: this.cifWebService.MakePaymentforTest(fd) }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (results: any) => {
        const url = results?.payment?.item1?.[0]?.url;
        if (url?.length) {
          window.location.href = url;
        } else {
          Swal.fire({ title: 'Error Occurred, Try Again Later', text: 'Payment URL not found!', icon: 'error' });
        }
      },
      error: () =>
        Swal.fire({ title: 'Error', text: 'Payment Gateway Failed!', icon: 'error' }),
    });
  }




  private withLoader<T>(source$: Observable<T>): Observable<T> {
    const start = Date.now();
    this.loadingIndicator.set(true);
    return source$.pipe(
      finalize(() => {
        const delay = Math.max(1000 - (Date.now() - start), 0);
        setTimeout(() => this.loadingIndicator.set(false), delay);
      })
    );
  }
}




















































































































































































































































































































































































































































































































































































































