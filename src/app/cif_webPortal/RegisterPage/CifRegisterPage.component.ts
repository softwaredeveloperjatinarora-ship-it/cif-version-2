import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import swal from 'sweetalert2';


import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { TopBar } from "../top-bar/top-bar";
import { EventsCarousel } from '../../shared/EventsCarousel/events-carousel';
import { MFacilitiesSection } from '../../shared/FacilitiesSection/Facilities-section';


const passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pw  = group.get('Password')?.value;
  const cpw = group.get('ConfirmPassword')?.value;
  if (pw && cpw && pw !== cpw) {
    group.get('ConfirmPassword')?.setErrors({ mismatch: true });
    return { mismatch: true };
  }

  const cpwCtrl = group.get('ConfirmPassword');
  if (cpwCtrl?.hasError('mismatch')) {
    const { mismatch, ...rest } = cpwCtrl.errors ?? {};
    cpwCtrl.setErrors(Object.keys(rest).length ? rest : null);
  }
  return null;
};

@Component({
  selector: 'app-CifRegisterPage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgbCarouselModule,
    TopBar, EventsCarousel,
        MFacilitiesSection
  ],
  templateUrl: './CifRegisterPage.component.html',
  styleUrls: ['./CifRegisterPage.component.scss'],
})
export class CifRegisterPageComponent implements OnInit {


  private readonly cifWebService = inject(LpuCIFWebService);
  private readonly fb            = inject(FormBuilder);
  private readonly router        = inject(Router);


  readonly loadingIndicator  = signal(false);
  readonly isLoading         = signal(true);


  isForm1Submitted    = false;
  serverConnectionError = false;


  instrumentsData:     any[] = [];
  tmpsInstrumentsData: any[] = [];
  loadingStates:       boolean[] = [];
  chunkedEvents:       any[][] = [];


  @ViewChild('facilitiesSection') facilitiesSection!: ElementRef;


  readonly cifUserForm = this.fb.group(
    {
      EmailId:         ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      CandidateName:   ['', [Validators.required, Validators.maxLength(30)]],
      Supervisorname:  ['', [Validators.required, Validators.maxLength(30)]],
      MobileNumber:    ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      InstituteName:   ['', [Validators.required, Validators.maxLength(30)]],
      DepartmentName:  ['', [Validators.required, Validators.maxLength(30)]],
      IdProofType:     ['', Validators.required],
      IdProofNumber:   ['', [Validators.required, Validators.maxLength(15)]],
      Address:         ['', [Validators.required, Validators.maxLength(150)]],
      Password:        ['', [Validators.required, Validators.minLength(6), Validators.maxLength(15)]],
      ConfirmPassword: ['', [Validators.required, Validators.maxLength(15)]],
      UserRole:        ['', Validators.required],
    },
    { validators: passwordMatchValidator }
  );


  get form1() { return this.cifUserForm.controls; }


  ngOnInit(): void {
    this.getAllInstruments();
    this.chunkedEvents = this.chunkArray(this.events, 3);
  }


  OnReset(): void {
    this.cifUserForm.reset({
      EmailId: '', CandidateName: '', Supervisorname: '',
      MobileNumber: '', InstituteName: '', DepartmentName: '',
      IdProofType: '', IdProofNumber: '', UserRole: '',
      Address: '', Password: '', ConfirmPassword: '',
    });
    this.isForm1Submitted = false;
  }

  Onsubmit(): void {
    this.isForm1Submitted = true;

    if (this.cifUserForm.invalid) {
      this.cifUserForm.markAllAsTouched();
      return;
    }

    this.loadingIndicator.set(true);
    const startTime = Date.now();
    const v = this.cifUserForm.value;

    const formData = new FormData();
    formData.append('UserEmail',      v.EmailId!);
    formData.append('CandidateName',  v.CandidateName!);
    formData.append('SupervisorName', v.Supervisorname!);
    formData.append('MobileNumber',   v.MobileNumber!);
    formData.append('SchoolName',     v.InstituteName!);
    formData.append('DepartmentName', v.DepartmentName!);
    formData.append('IdProofType',    v.IdProofType!);
    formData.append('IdProofNumber',  v.IdProofNumber!);
    formData.append('UserType',       v.UserRole!);
    formData.append('Address',        v.Address!);
    formData.append('PasswordText',   v.Password!);

    this.cifWebService.NewUserRecord(formData).subscribe({
      next: (data) => {
        const delay = Math.max(500 - (Date.now() - startTime), 0);
        setTimeout(() => this.loadingIndicator.set(false), delay);

        if (data?.error) {
          this.serverConnectionError = true;
          swal.fire({ title: 'Server Connection Error', text: 'Data Server Connection error, Try again later', icon: 'error' });
          return;
        }

        const result    = data.item1[0]['msg'];
        const errorCode = data.item1[0]['returnId'];

        if (result === 'Success') {
          swal.fire({ title: 'User Login Created Successfully', text: result, icon: 'success' })
            .then(() => this.router.navigate(['/Login']));
        } else if (errorCode === -1) {
          swal.fire({ title: 'User Already Exists', icon: 'error' })
            .then(() => window.location.reload());
        } else {
          swal.fire({ title: 'Some Technical Issue', text: result, icon: 'error' })
            .then(() => window.location.reload());
        }
      },
      error: () => {
        this.loadingIndicator.set(false);
        swal.fire({ title: 'Error Occurred', text: 'Unable to complete the request. Please try again later.', icon: 'error' });
      },
    });
  }


  gotoFacilities(): void {
    this.facilitiesSection?.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  goto(path: string): void { this.router.navigateByUrl(path); }

  visitUrl(prefix: string, name: string, id: any, catId: any): void {
    this.router.navigateByUrl(`${prefix}/${name}/${id}/${catId}`);
  }

  gotoHome(): void { this.router.navigateByUrl('Home'); }


  onImageLoad(index: number): void  { this.loadingStates[index] = false; }
  onImageError(event: Event, index: number): void {
    (event.target as HTMLImageElement).src = '/image.jpg';
    this.loadingStates[index] = false;
  }


  openSampleInstructions(): void {
    swal.fire({
      title: 'Send Samples at Following Address:',
      html: `<address><div class="contact-text">
               Central Instrumentation Facility (CIF)<br/>
               Lovely Professional University<br/>
               Block-38, Room No.106<br/>
               Jalandhar - Delhi G.T. Road,<br/>
               Phagwara, Punjab (India) - 144411<br/>
               Phone: <a href="tel:+911824444021">+91 1824-444021</a><br/>
               Email: cif@lpu.co.in
             </div></address>`,
      icon: 'info',
    });
  }


  getAllInstruments(): void {
    this.loadingIndicator.set(true);
    const startTime = Date.now();

    this.cifWebService.GetAllInstrumentsData().subscribe({
      next: (response) => {
        const items: any[] = response.item1?.length > 0 ? response.item1 : this.dataItems;
        this.instrumentsData     = items;
        this.tmpsInstrumentsData = [...items];
        this.loadingStates       = Array(items.length).fill(true);
        if (!response.item1?.length) { this.serverConnectionError = true; }

        const delay = Math.max(500 - (Date.now() - startTime), 0);
        setTimeout(() => this.loadingIndicator.set(false), delay);
      },
      error: (err) => {
        console.error(err);
        this.instrumentsData     = this.dataItems;
        this.tmpsInstrumentsData = [...this.dataItems];
        this.loadingStates       = Array(this.dataItems.length).fill(true);
        this.serverConnectionError = true;
        this.loadingIndicator.set(false);
      },
    });
  }


  chunkArray<T>(arr: T[], size: number): T[][] {
    return arr.reduce<T[][]>((acc, _, i) =>
      i % size ? acc : [...acc, arr.slice(i, i + size)], []);
  }


  readonly events = [
    { img: 'https://www.lpu.in/lpu-assets/images/cif/summer-training-programme-2025.webp', title: 'ANRF Sponsored Summer Training Programme', date: '(2 June - 11 July 2025)' },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-10.jpg', title: 'Discovering the Crystalline and Nano world using X-ray Diffraction and Particle Size and Zeta Potential Analyzer: A National Workshop', date: '(24 – 26 April 2025)' },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-9.jpg', title: 'National Workshop on Advance Research with Field Emission Scanning Electron Microscopy: Exploring the Nano-Structural Imaging', date: '(27 - 29 March 2025)' },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-7.jpg', title: 'National Workshop on Advanced Chromatographic Techniques Theory & Applications', date: '(19 - 21 September, 2024)' },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-8.jpg', title: 'SHORT-TERM COURSE on Advanced Materials analysis & Characterization Techniques: Hands-on-Training and Data Interpretation', date: '(09 – 13 December, 2024)' },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-1.jpg', title: 'National workshop on X-Ray Diffraction and Particle Size Analyzer', date: '(26 - 27 April 2024)' },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-2.jpg', title: 'Summer Training Programme', date: '(3 June - 13 July 2024)' },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-3.jpg', title: 'Workshop on Field Emission Scanning Electron Microscope', date: '(29 - 30 March 2024)' },
  ];

  readonly dataItems = [
    { id: 1,  instrumentId: 0, instrumentName: 'Field Emission Scanning Electron Microscope, FESEM JEOL JSM-7610F-PLUS',        categoryId: 1,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_23899918_2_2025_100006_FESEM-Instrument.JPG' },
    { id: 2,  instrumentId: 0, instrumentName: 'Powder XRD (Bruker D8 Advance)',                                                 categoryId: 2,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_2005552723_2_2025_100009_XRD-Instrument.JPG' },
    { id: 3,  instrumentId: 0, instrumentName: 'FTIR with Diamond ATR & Pellet accessories (Perkin Elmer Spectrum 2)',          categoryId: 3,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_926534728_2_2025_100014_FTIR-Instrument.JPG' },
    { id: 4,  instrumentId: 0, instrumentName: 'Fluorescence Spectrometer (Perkin Elmer LS6500)',                               categoryId: 4,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1449097689_2_2025_100011_Flourescence-Instrument.JPG' },
    { id: 5,  instrumentId: 0, instrumentName: 'Thermogravimetric analyzer (Perkin Elmer TGA 4000)',                            categoryId: 5,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_543001469_2_2025_100012_TGA-Instrument.JPG' },
    { id: 6,  instrumentId: 0, instrumentName: 'Differential scanning calorimeter (Perkin Elmer DSC 6000)',                     categoryId: 6,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1507892084_2_2025_100013_DSC-Instrument.JPG' },
    { id: 9,  instrumentId: 0, instrumentName: 'Gas Chromatography and Mass Spectroscopy, Shimadzu GCMS TQ8040 NX',            categoryId: 7,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_2009182246_2_2025_100008_GCMS-Instrument.JPG' },
    { id: 10, instrumentId: 0, instrumentName: 'High Performance and Liquid Chromatography, Shimadzu Prominence LPGE',         categoryId: 8,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_34620374_2_2025_100007_HPLC-Instrument.JPG' },
    { id: 11, instrumentId: 0, instrumentName: 'Electrochemical workstation, Metrohm: Multi-Channel Autolab AUT.MAC.204',      categoryId: 9,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1060204202_3_2026_100000_ADP_2248.JPG' },
    { id: 12, instrumentId: 0, instrumentName: 'Density meter (Axis Density Meter with analytical balance ALN-220)',           categoryId: 10, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_382530855_2_2025_100002_Density_Meter-Instrument.jpg' },
    { id: 13, instrumentId: 0, instrumentName: 'Refrigerated Centrifuge (Eppendorf 5804R)',                                    categoryId: 11, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_259413724_2_2025_100003_Refrigerated_Centirfuge-Instrument.JPG' },
    { id: 14, instrumentId: 0, instrumentName: 'Viscometer (LABMAN model LMDV-200)',                                           categoryId: 12, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_696381150_2_2025_100001_ADP_2298---.JPG' },
    { id: 15, instrumentId: 0, instrumentName: 'Particle size and Zeta potential analyzer (Malvern Zetasizer Nano ZS90)',      categoryId: 13, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_284316046_2_2025_100010_Particle_Size-Instrument.JPG' },
    { id: 21, instrumentId: 0, instrumentName: 'Shimadzu UV-1800 UV-Vis',                                                     categoryId: 14, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1208223655_17_2025_100004_-14-UV.JPG' },
    { id: 22, instrumentId: 0, instrumentName: 'ICP-OES, PerkinElmer Optima 8000',                                            categoryId: 15, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_323568347_3_2025_100005_ICP-OES-Instrument-21.jpg' },
    { id: 23, instrumentId: 0, instrumentName: 'Distilled Water (milli-Q water)',                                             categoryId: 0,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_507378691_3_2025_100015_noImage.jpg' },
  ];
}