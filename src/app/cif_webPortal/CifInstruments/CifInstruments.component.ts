// CifInstruments.component.ts

import { Component, OnInit, signal, computed, inject, ViewChild, ElementRef, ChangeDetectorRef, DOCUMENT, Inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TopBar } from '../top-bar/top-bar';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { Specification } from './specification.model';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';
import { FormBuilder } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LoginSessionService } from '../../services/login-session.service';
import { CookieService } from 'ngx-cookie-service';
import { ColumnMode } from '@swimlane/ngx-datatable';

// Interface for Instrument Data
interface InstrumentData {
  id: number;
  instrumentId: number;
  instrumentName: string;
  categoryId: number;
  isActive: boolean;
  imageUrl: string;
}

// Interface for FAQ
interface FAQ {
  question: string;
  isOpen: boolean;
  answer: string;
}

// Interface for Instrument Details with Specifications
interface InstrumentDetails {
  instrumentName: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  specifications: Specification[];
}

@Component({
  selector: 'app-cif-instruments',
  standalone: true,
  imports: [CommonModule, TopBar, RouterLink], // Added RouterLink and CommonModule
  templateUrl: './CifInstruments.component.html',
  styleUrls: ['./CifInstruments.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('void', style({ height: 0, opacity: 0 })),
      transition(':enter', [
        animate('400ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('400ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ])
  ]
})
export class CifInstrumentsComponent implements OnInit {

  ColumnMode = ColumnMode;
  columns: any;
  headHtmlData: any[] = [];
  p: any = 1;
  perPage: any = 5;
    @ViewChild('table') table: ElementRef | undefined;
  displayedColumns: string[] = [
    'instrumentName', 'analysisType', 'analysisCharges', 'noOfSamples',
    'totalCharges', 'remarks', 'bookingRequestDate',
  ];
  instrumentStatus: string = '';
  specifications: Specification[] = [];
  cifInstrumentsDataData: any[] = [];
  ResultData: any[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  tmpscifInstrumentsDataData: any[] = [];
  InstrumentId: any;
  UserRole: any;
  UserId: any;
  uploadEnabled: boolean | undefined;
  Remarks: any;
  dataSource: any;
  ServerUrl: any;
  Description: any;
  ImageUrl: any;
  categoryId: number | undefined;
  selectedInstrument: any = null;
  cifInstrumentsCharges: any;
  tmpscifInstrumentsCharges: any;
  // Dependencies

  // State Management with Signals
  instruments = signal<InstrumentData[]>([]);
  featuredInstruments = computed(() => this.instruments().slice(0, 8)); // For 'Facilities' section
  loadingIndicator = signal(false);
  
  // Selected Instrument Details
  selectedInstrumentId = signal<number | null>(null);
  instrumentDetails = signal<InstrumentDetails | null>(null);
  
  // Computed Signals for Template
  isInstrumentActive = computed(() => this.instrumentDetails()?.isActive ?? false);
  instrumentName = computed(() => this.instrumentDetails()?.instrumentName ?? '');
  instrumentDescription = computed(() => this.instrumentDetails()?.description ?? '');
  instrumentImageUrl = computed(() => this.instrumentDetails()?.imageUrl ?? '');
  instrumentSpecifications = computed(() => this.instrumentDetails()?.specifications ?? []);

  // UI State
  imageLoadingStates = signal<boolean[]>([]);
    navigateToLogin(): void {
    // this.modalService.dismissAll();
    this.router.navigate(['/Login']);
  }
    constructor(
    private CIFwebService: LpuCIFWebService,
    private storageService: StorageService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdRef: ChangeDetectorRef,
    @Inject(DOCUMENT) document: Document,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private AuthSession: LoginSessionService,
    private router: Router,
    private route: ActivatedRoute,
    private cookieService: CookieService
  ) { }
  @ViewChild('chargesModal') chargesModal!: ElementRef;
  openChargesModal(id: any): void {
    this.getChargesDetails(id);
    this.modalService.open(this.chargesModal, { size: 'sm' }).result.then(
      (result: string) => {
        console.log("Modal closed" + result);
      }
    ).catch((res: any) => { });
  }

  getChargesDetails(Id: any) {
    this.CIFwebService.GetChargesDetails(Id).subscribe({
      next: response => {
        if (response.item1 && response.item1.length > 0) {
          this.cifInstrumentsCharges = response.item1;
          this.dataSource = response.item1;
          this.tmpscifInstrumentsCharges = response.item1;
          this.headHtmlData = this.tmpscifInstrumentsCharges[0];
          this.columns = Object.keys(this.tmpscifInstrumentsCharges[0]);
          this.columns = this.columns.filter((item: any) => item !== 'ResultFile' && item !== 'userId' && item !== 'id' && item !== 'analysisId');
          // this.loadingIndicator = false;
        } else {
          this.cifInstrumentsCharges = [];
        }
      },
      error: err => {
        console.log(err);
      }
    });
  }

  // FAQs data (kept local as per original HTML structure)
  faqs = signal<FAQ[]>([
    {
      question: 'Field Emission Scanning Electron Microscope (FE SEM)',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> How many samples can be submitted in a single request form?</dt>
              <dd><strong>Ans:</strong> Maximum of 5 samples</dd>
              <dt><strong>Q2:</strong> Does the Gold sputtering process affect the sample?</dt>
              <dd><strong>Ans:</strong> No, the process only creates a very thin coating on the sample surface to enhance the conductivity for good imaging.</dd>
              <dt><strong>Q3:</strong> What amount of sample is required for FESEM?</dt>
              <dd><strong>Ans:</strong> Powder: Minimum of 2.5 to 5mg. Film: Maximum allowed size 1cm x 1cm.</dd>
              <dt><strong>Q4:</strong> How will we come to know about the slot allocation?</dt>
              <dd><strong>Ans:</strong> The concerned operator/office assistant will intimate you at least a week before your slot by calling you.</dd>
            </dl>
          `
    },
    // ... (include all other FAQ items from the original file)
    {
      question: 'UV-Vis Spectrophotometer',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> What wavelength range is used for your UV-Vis instrument?</dt>
              <dd><strong>Ans:</strong> 200 nm to 800 nm</dd>
              <dt><strong>Q2:</strong> Can I reuse the sample after the analysis for other experiments?</dt>
              <dd><strong>Ans:</strong> Yes, if your sample is not UV sensitive you can reuse it. UV-Vis spectrometer analysis is a non-destructive method.</dd>
              <dt><strong>Q3:</strong> Is it necessary to provide final dilution of sample for UV analysis?</dt>
              <dd><strong>Ans:</strong> Yes, user must provide the sample in final diluted form.</dd>
            </dl>
          `
    },
    {
      question: 'Thermogravimetric Analysis (TGA)',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> How much sample is required for TGA analysis?</dt>
              <dd><strong>Ans:</strong> 5–8mg</dd>
              <dt><strong>Q2:</strong> What is the normally used heating rate in TGA analysis?</dt>
              <dd><strong>Ans:</strong> 10°C/Min</dd>
              <dt><strong>Q3:</strong> Can we do TGA analysis of Liquid samples?</dt>
              <dd><strong>Ans:</strong> No! TGA analysis can only be performed on Powder or Film samples.</dd>
              <dt><strong>Q4:</strong> What is the maximum possible heating range of the TGA instrument available in CIF?</dt>
              <dd><strong>Ans:</strong> 1000°C</dd>
            </dl>
          `
    },
    {
      question: 'Differential Scanning Calorimeter (DSC)',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> How much sample is required for DSC analysis?</dt>
              <dd><strong>Ans:</strong> 8–10mg</dd>
              <dt><strong>Q2:</strong> Which gases are used for the analysis process?</dt>
              <dd><strong>Ans:</strong> Nitrogen</dd>
              <dt><strong>Q3:</strong> Which type of sample pan is used in DSC?</dt>
              <dd><strong>Ans:</strong> Aluminium type</dd>
            </dl>
          `
    },
    {
      question: 'Powder X-ray Diffractometer (XRD)',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> Can I use the sample after XRD analysis?</dt>
              <dd><strong>Ans:</strong> Yes! XRD is non-destructive. The sample can be reused.</dd>
              <dt><strong>Q2:</strong> I have an unknown mineral sample. Can I use XRD to identify it?</dt>
              <dd><strong>Ans:</strong> Yes! XRD can identify crystal patterns or phases. For better results, run XRF first to know composition.</dd>
              <dt><strong>Q3:</strong> Which databases are available?</dt>
              <dd><strong>Ans:</strong> ICSD, PDF2 ICDD (JCPDS), Software: Highscore Plus</dd>
              <dt><strong>Q4:</strong> What amount of sample is required?</dt>
              <dd><strong>Ans:</strong> Powder: Minimum 400–500 mg</dd>
            </dl>
          `
    },
    {
      question: 'FTIR Spectrometer',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> What type of samples can be analyzed?</dt>
              <dd><strong>Ans:</strong> Powder and Liquid samples</dd>
              <dt><strong>Q2:</strong> Can we analyze liquid samples?</dt>
              <dd><strong>Ans:</strong> Yes</dd>
              <dt><strong>Q3:</strong> In which ranges can we obtain IR spectra?</dt>
              <dd><strong>Ans:</strong> 4000–400 cm-1</dd>
              <dt><strong>Q4:</strong> How much sample is required?</dt>
              <dd><strong>Ans:</strong> 5–10 mg</dd>
            </dl>
          `
    },
    {
      question: 'Gas Chromatography with Mass Spectrometry (GC-MS/MS)',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> Can gas samples be analyzed?</dt>
              <dd><strong>Ans:</strong> No, only solid and liquid samples</dd>
              <dt><strong>Q2:</strong> Do I have to submit reference standards?</dt>
              <dd><strong>Ans:</strong> Yes, required for quantitative analysis</dd>
              <dt><strong>Q3:</strong> Are results provided with library comparison?</dt>
              <dd><strong>Ans:</strong> Yes, NIST library comparison data is provided</dd>
              <dt><strong>Q4:</strong> Can direct injection mass spectra be obtained?</dt>
              <dd><strong>Ans:</strong> Yes, using MS/MS in CIF</dd>
            </dl>
          `
    },
    {
      question: 'High Performance Liquid Chromatography (HPLC)',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> What is the minimum quantity required?</dt>
              <dd><strong>Ans:</strong> Powder: 5–10 mg; Liquid: Minimum 2 ml final dilution</dd>
              <dt><strong>Q2:</strong> Do I have to submit reference standards?</dt>
              <dd><strong>Ans:</strong> Yes, required for quantitative analysis</dd>
              <dt><strong>Q3:</strong> What detectors are available?</dt>
              <dd><strong>Ans:</strong> PDA (Photo Diode Array), RID (Refractive Index Detector)</dd>
            </dl>
          `
    },
    {
      question: 'Particle Size Analyser (Zetasizer Nano)',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> What are some specifications?</dt>
              <dd><strong>Ans:</strong> Laser λ=633 nm, Temp 2°C–90°C</dd>
              <dt><strong>Q2:</strong> What cuvettes are available?</dt>
              <dd><strong>Ans:</strong> Quartz low volume, Disposable polystyrene, Folded capillary cuvettes</dd>
              <dt><strong>Q3:</strong> What sample volume is needed?</dt>
              <dd><strong>Ans:</strong> 1 ml (polystyrene), 0.75 ml (capillary), 12 μL (quartz)</dd>
              <dt><strong>Q4:</strong> What is a good concentration?</dt>
              <dd><strong>Ans:</strong> Depends on particle properties and polydispersity</dd>
            </dl>
          `
    },
    {
      question: 'Fluorescence Spectrometer',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> What type of samples can be analyzed?</dt>
              <dd><strong>Ans:</strong> Powder and Liquid</dd>
              <dt><strong>Q2:</strong> How much sample is required?</dt>
              <dd><strong>Ans:</strong> Powder: 200 mg; Liquid: 2 ml</dd>
              <dt><strong>Q3:</strong> Do I need excitation/emission ranges?</dt>
              <dd><strong>Ans:</strong> Yes, must be provided</dd>
              <dt><strong>Q4:</strong> What if I don’t know the wavelength region?</dt>
              <dd><strong>Ans:</strong> Run UV spectroscopy first; fluorescence follows UV peaks</dd>
            </dl>
          `
    },
    {
      question: 'ICP-OES',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> Should I submit final dilution?</dt>
              <dd><strong>Ans:</strong> Yes, only final diluted sample with digestion is accepted</dd>
              <dt><strong>Q2:</strong> What is the minimum quantity required?</dt>
              <dd><strong>Ans:</strong> 40–50 ml final dilution</dd>
              <dt><strong>Q3:</strong> Do I need reference standards?</dt>
              <dd><strong>Ans:</strong> Yes, required for quantitative analysis</dd>
            </dl>
          `
    },
    {
      question: 'Electrochemical Workstation',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> What areas are covered?</dt>
              <dd><strong>Ans:</strong> Supercapacitors, Batteries, Biosensors, Corrosion, Electrodepositions</dd>
              <dt><strong>Q2:</strong> Do you provide photo-sensitive measurements?</dt>
              <dd><strong>Ans:</strong> No, light source not available</dd>
              <dt><strong>Q3:</strong> Which electrodes are provided?</dt>
              <dd><strong>Ans:</strong> Ag/AgCl, Platinum wire, Glass carbon, Carbon electrodes</dd>
              <dt><strong>Q4:</strong> Do I need to provide parameters?</dt>
              <dd><strong>Ans:</strong> Yes, must be provided</dd>
              <dt><strong>Q5:</strong> Do you prepare working electrodes?</dt>
              <dd><strong>Ans:</strong> Normally provided by user; may be prepared with extra charges</dd>
              <dt><strong>Q6:</strong> Can I reuse samples?</dt>
              <dd><strong>Ans:</strong> Depends case by case; ask operator</dd>
            </dl>
          `
    },
    {
      question: 'Viscometer',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> Can I analyse solid samples?</dt>
              <dd><strong>Ans:</strong> No, only liquids (free-flowing or slightly viscous)</dd>
              <dt><strong>Q2:</strong> Can I analyse liquid samples at high temperature?</dt>
              <dd><strong>Ans:</strong> No, only ambient temperature</dd>
              <dt><strong>Q3:</strong> How much sample is required?</dt>
              <dd><strong>Ans:</strong> At least 40–50 ml liquid</dd>
            </dl>
          `
    }
  ]);
  
  // Method to open/close the charges modal (assuming chargesModal is still needed for a modal service)
  // cifInstrumentsCharges: any[] = []; // Property to hold charges data if implemented
  // navigateToLogin(): void { /* ... logic ... */ } 
  // getChargesDetails(Id: any) { /* ... logic ... */ }
  // openChargesModal(id: number): void { /* ... logic ... */ }

  ngOnInit(): void {
    this.getAllInstruments();
  }

  // --- Navigation & Utility Methods ---

  goto(path: string): void {
    this.router.navigateByUrl(path);
  }

  // Modern scroll to element (no need for PLATFORM_ID)
  gotoFacilities(): void {
    const section = document.getElementById('CIF_Facilities');
    section?.scrollIntoView({ behavior: 'smooth' });
  }

  VisitUrl(base: string, name: string, id: number, categoryId: number): void {
    // The original code uses queryParams in one place and path parameters in the commented-out code.
    // Sticking to queryParams as per the functioning original code block.
    this.router.navigate([base], {
      queryParams: { id, name, categoryId }
    });
  }

  // --- API Calls ---

  getAllInstruments(): void {
    this.loadingIndicator.set(true);
    this.CIFwebService.GetAllInstrumentsData().subscribe({
      next: (response) => {
        if (response.item1 && response.item1.length > 0) {
          this.instruments.set(response.item1 as InstrumentData[]);
          // Initialize loading states for images in Facilities section
          this.imageLoadingStates.set(Array(this.featuredInstruments().length).fill(true));
        } else {
          this.instruments.set([]);
        }
        this.loadingIndicator.set(false);
      },
      error: (err) => {
        console.error('Error fetching instruments:', err);
        this.loadingIndicator.set(false);
      }
    });
  }

  // fetchSpecifications(categoryId: number, instrumentId: number): void {
  //   this.loadingIndicator.set(true);
  //   this.selectedInstrumentId.set(instrumentId);
  //   this.instrumentDetails.set(null); // Clear previous selection

  //   this.CIFwebService.fetchSpecifications().subscribe({
  //     next: (response) => {
  //       alert(JSON.stringify(response.item1))
  //       if (response.item1 && response.item1.length > 0) {
  //         const data = response.item1[0]; 
  //         console.log(JSON.stringify(data));
  //         alert(JSON.stringify(data));
  //         this.instrumentDetails.set({
  //           instrumentName: data.instrumentName,
  //           description: data.description,
  //           imageUrl: data.imageUrl,
  //           isActive: data.isActive,
  //           specifications: data.specifications || []
  //         });
  //       } else {
  //         // Handle case where no details are returned
  //         this.instrumentDetails.set({
  //           instrumentName: 'Not Found',
  //           description: 'Details not available.',
  //           imageUrl: '',
  //           isActive: false,
  //           specifications: []
  //         });
  //       }
  //       this.loadingIndicator.set(false);
  //     },
  //     error: (err) => {
  //       console.error('Error fetching specifications:', err);
  //       this.instrumentDetails.set(null);
  //       this.loadingIndicator.set(false);
  //     }
  //   });
  // }

  // --- UI Handlers ---


  fetchSpecifications(categoryId: number, instrumentId: number): void {
    this.loadingIndicator.set(true);
    this.selectedInstrumentId.set(instrumentId);
    this.instrumentDetails.set(null); // Clear previous selection

    // 1. Find the basic instrument details from the instruments list
    // This provides the InstrumentName, ImageUrl, and IsActive status
    const basicDetails = this.instruments().find(inst => inst.id === instrumentId);

    if (!basicDetails) {
        console.error(`Could not find instrument with ID ${instrumentId} in the main list.`);
        this.loadingIndicator.set(false);
        return;
    }
    
    // NOTE: Replace this.CIFwebService.fetchSpecifications() with the correct call 
    // that fetches the specifications for the selected instrument.
    // Since the service method signature wasn't provided, we keep the original call but assume it works.
    this.CIFwebService.fetchSpecifications().subscribe({
      next: (response) => {
        // BUG FIX: The API seems to return the array of specifications (response.item1) directly, 
        // NOT a full instrument object containing a 'specifications' property.
        // We use the basic details (name, image) and combine it with the fetched specs.
        
        const specificationsArray = response.item1 as Specification[] || [];

        this.instrumentDetails.set({
            instrumentName: basicDetails.instrumentName,
            
            description: 'Instrument description is currently unavailable from this endpoint.', 
            imageUrl: basicDetails.imageUrl, 
            isActive: basicDetails.isActive,
            specifications: specificationsArray // <-- FIXED: Use the response array directly
        });
        
        this.loadingIndicator.set(false);
      },
      error: (err) => {
        console.error('Error fetching specifications:', err);
        this.instrumentDetails.set(null);
        this.loadingIndicator.set(false);
      }
    });
  }
  toggleAccordion(selectedFaq: FAQ): void {

    this.faqs.update(faqs => 
      faqs.map(faq => ({ 
        ...faq, 
        isOpen: faq === selectedFaq ? !faq.isOpen : false 
      }))
    );
  }

  onImageLoad(i: number): void {
    this.imageLoadingStates.update(states => {
      const newStates = [...states];
      newStates[i] = false;
      return newStates;
    });
  }

  onImageError(event: Event, i: number): void {
    this.imageLoadingStates.update(states => {
      const newStates = [...states];
      newStates[i] = false;
      return newStates;
    });
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-placeholder.png'; // Fallback image
  }
}

// import swal from 'sweetalert2';
// import { FormBuilder } from '@angular/forms';
// import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
// import { CookieService } from 'ngx-cookie-service';
// import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { Router, ActivatedRoute } from '@angular/router';

// import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
// import { TopBar } from "../top-bar/top-bar";
// import { AuthService } from '../../services/auth.service';
// import { StorageService } from '../../services/storage.service';
// import { LoginSessionService } from '../../services/login-session.service';
// import { CifMenuBarComponent } from '../../InternalUserDashboard/cif-menu-bar/cif-menu-bar.component';
// import { CommonModule } from '@angular/common';
// import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';

// import { Specification } from './specification.model';
// import { ColumnMode } from '@swimlane/ngx-datatable';
// import { DOCUMENT } from '@angular/common';
// // import { trigger, state, style, transition, animate } from '@angular/animations';

// interface FAQ {
//   question: string;
//   isOpen: boolean;
//   answer: string;
// }

// @Component({
//   selector: 'app-CifInstruments',
//   templateUrl: './CifInstruments.component.html',
//   styleUrls: ['./CifInstruments.component.scss'],
//   standalone: true,
//   imports: [CommonModule, TopBar, NgbCarouselModule],
//   // animations: [
//   //   trigger('slideInOut', [
//   //     state('void', style({ height: '0px', opacity: 0 })),
//   //     state('*', style({ height: '*', opacity: 1 })),
//   //     transition('void <=> *', animate('300ms ease-in-out'))
//   //   ])
//   // ]
// })
// export class CifInstrumentsComponent implements OnInit {
//   @ViewChild('facilitiesSection') facilitiesSection!: ElementRef;
//   // Method to scroll to the Facilities section
//   gotoFacilities() {
//     this.facilitiesSection.nativeElement.scrollIntoView({ behavior: 'smooth' });
//   }
//   ColumnMode = ColumnMode;
//   columns: any;
//   loadingIndicator = false;
//   headHtmlData: any[] = [];
//   p: any = 1;
//   perPage: any = 5;
//   @ViewChild('table') table: ElementRef | undefined;
//   displayedColumns: string[] = [
//     'instrumentName', 'analysisType', 'analysisCharges', 'noOfSamples',
//     'totalCharges', 'remarks', 'bookingRequestDate',
//   ];
//   instrumentStatus: string = '';
//   isInstrumentActive: boolean = false;
//   specifications: Specification[] = [];
//   cifInstrumentsDataData: any[] = [];
//   ResultData: any[] = [];
//   currentPage = 1;
//   itemsPerPage = 10;
//   tmpscifInstrumentsDataData: any[] = [];
//   InstrumentId: any;
//   instrumentName: any = '';
//   UserRole: any;
//   UserId: any;
//   uploadEnabled: boolean | undefined;
//   Remarks: any;
//   dataSource: any;
//   ServerUrl: any;
//   Description: any;
//   ImageUrl: any;
//   categoryId: number | undefined;
//   selectedInstrument: any = null;
//   cifInstrumentsCharges: any;
//   tmpscifInstrumentsCharges: any;

//   constructor(
//     private CIFwebService: LpuCIFWebService,
//     private storageService: StorageService,
//     private authService: AuthService,
//     private fb: FormBuilder,
//     private cdRef: ChangeDetectorRef,
//     @Inject(DOCUMENT) document: Document,
//     private modalService: NgbModal,
//     private cdr: ChangeDetectorRef,
//     private AuthSession: LoginSessionService,
//     private router: Router,
//     private route: ActivatedRoute,
//     private cookieService: CookieService
//   ) { }

//   ngOnInit(): void {
//     // this.getAllInstrumentss();
//     this.getAllInstruments();
//     this.route.paramMap.subscribe((params) => {
//       this.InstrumentId = Number(params.get('id'));
//       this.categoryId = Number(params.get('categoryId'));

//       // Fetch specifications after setting InstrumentId and categoryId
//       if (this.InstrumentId && this.categoryId) {
//         this.fetchSpecifications(this.categoryId, this.InstrumentId);
//       }
//     });
//   }

//   getAllInstruments() {
//     this.CIFwebService.GetAllInstrumentsData().subscribe({
//       next: response => {
//         if (response.item1 && response.item1.length > 0) {
//           this.cifInstrumentsDataData = response.item1;
//           this.dataSource = response.item1;
//           this.tmpscifInstrumentsDataData = response.item1;
//           this.headHtmlData = this.tmpscifInstrumentsDataData[0];
//           this.columns = Object.keys(this.tmpscifInstrumentsDataData[0]);
//           this.columns = this.columns.filter((item: any) => item !== 'ResultFile' && item !== 'userId' && item !== 'id' && item !== 'analysisId');
//           this.loadingIndicator = false;
//         } else {
//           this.cifInstrumentsDataData = [];
//         }
//       },
//       error: err => {
//         console.log(err);
//       }
//     });
//   }

//   fetchSpecifications(categoryId: any, id: any): void {
//     this.InstrumentId = id;
//     this.CIFwebService.fetchSpecifications().subscribe({
//       next: (response: any) => {
//         if (response.item1 && Array.isArray(response.item1) && response.item1.length > 0) {
//           const allSpecifications: Specification[] = response.item1;
//           const activeInstrument = this.cifInstrumentsDataData.some(
//             (x: { isActive: boolean, id: any }) => x.isActive === true && x.id === this.InstrumentId
//           );

//           const instrument = this.cifInstrumentsDataData.find(
//             (x: { id: any, instrumentName: string }) => x.id == this.InstrumentId
//           );

//           if (instrument) {
//             this.instrumentName = instrument.instrumentName;
//             this.ImageUrl = instrument.imageUrl;
//             this.Description = instrument.description;
//             this.isInstrumentActive = activeInstrument;
//             this.specifications = allSpecifications.filter(
//               (spec: Specification) => spec.categoryId === categoryId
//             );
//           } else {
//             this.isInstrumentActive = false;
//             this.specifications = [];
//           }

//           this.cdr.detectChanges();
//         } else {
//           this.specifications = [];
//         }
//       },
//       error: (err) => {
//         console.error('Error fetching specifications:', err);
//       }
//     });
//   }

//   handleClick(instrument: any): void {
//     if (!instrument || !instrument.isActive) {
//       return;
//     }
//     this.fetchSpecifications(instrument.categoryId, instrument.id);
//   }

//   @ViewChild('chargesModal') chargesModal!: ElementRef;
//   openChargesModal(id: any): void {
//     this.getChargesDetails(id);
//     this.modalService.open(this.chargesModal, { size: 'sm' }).result.then(
//       (result: string) => {
//         console.log("Modal closed" + result);
//       }
//     ).catch((res: any) => { });
//   }

//   getChargesDetails(Id: any) {
//     this.CIFwebService.GetChargesDetails(Id).subscribe({
//       next: response => {
//         if (response.item1 && response.item1.length > 0) {
//           this.cifInstrumentsCharges = response.item1;
//           this.dataSource = response.item1;
//           this.tmpscifInstrumentsCharges = response.item1;
//           this.headHtmlData = this.tmpscifInstrumentsCharges[0];
//           this.columns = Object.keys(this.tmpscifInstrumentsCharges[0]);
//           this.columns = this.columns.filter((item: any) => item !== 'ResultFile' && item !== 'userId' && item !== 'id' && item !== 'analysisId');
//           this.loadingIndicator = false;
//         } else {
//           this.cifInstrumentsCharges = [];
//         }
//       },
//       error: err => {
//         console.log(err);
//       }
//     });
//   }

//   navigateToLogin(): void {
//     this.modalService.dismissAll();
//     this.router.navigate(['/Login']);
//   }
 

//   faqs: FAQ[] = [
//     {
//       question: 'Field Emission Scanning Electron Microscope (FE SEM)',
//       isOpen: false,
//       answer: `
//             <dl>
//               <dt><strong>Q1:</strong> How many samples can be submitted in a single request form?</dt>
//               <dd><strong>Ans:</strong> Maximum of 5 samples</dd>
//               <dt><strong>Q2:</strong> Does the Gold sputtering process affect the sample?</dt>
//               <dd><strong>Ans:</strong> No, the process only creates a very thin coating on the sample surface to enhance the conductivity for good imaging.</dd>
//               <dt><strong>Q3:</strong> What amount of sample is required for FESEM?</dt>
//               <dd><strong>Ans:</strong> Powder: Minimum of 2.5 to 5mg. Film: Maximum allowed size 1cm x 1cm.</dd>
//               <dt><strong>Q4:</strong> How will we come to know about the slot allocation?</dt>
//               <dd><strong>Ans:</strong> The concerned operator/office assistant will intimate you at least a week before your slot by calling you.</dd>
//             </dl>
//           `
//     },
//     {
//       question: 'UV-Vis Spectrophotometer',
//       isOpen: false,
//       answer: `
//             <dl>
//               <dt><strong>Q1:</strong> What wavelength range is used for your UV-Vis instrument?</dt>
//               <dd><strong>Ans:</strong> 200 nm to 800 nm</dd>
//               <dt><strong>Q2:</strong> Can I reuse the sample after the analysis for other experiments?</dt>
//               <dd><strong>Ans:</strong> Yes, if your sample is not UV sensitive you can reuse it. UV-Vis spectrometer analysis is a non-destructive method.</dd>
//               <dt><strong>Q3:</strong> Is it necessary to provide final dilution of sample for UV analysis?</dt>
//               <dd><strong>Ans:</strong> Yes, user must provide the sample in final diluted form.</dd>
//             </dl>
//           `
//     },
//     {
//       question: 'Thermogravimetric Analysis (TGA)',
//       isOpen: false,
//       answer: `
//             <dl>
//               <dt><strong>Q1:</strong> How much sample is required for TGA analysis?</dt>
//               <dd><strong>Ans:</strong> 5–8mg</dd>
//               <dt><strong>Q2:</strong> What is the normally used heating rate in TGA analysis?</dt>
//               <dd><strong>Ans:</strong> 10°C/Min</dd>
//               <dt><strong>Q3:</strong> Can we do TGA analysis of Liquid samples?</dt>
//               <dd><strong>Ans:</strong> No! TGA analysis can only be performed on Powder or Film samples.</dd>
//               <dt><strong>Q4:</strong> What is the maximum possible heating range of the TGA instrument available in CIF?</dt>
//               <dd><strong>Ans:</strong> 1000°C</dd>
//             </dl>
//           `
//     },
//     {
//       question: 'Differential Scanning Calorimeter (DSC)',
//       isOpen: false,
//       answer: `
//             <dl>
//               <dt><strong>Q1:</strong> How much sample is required for DSC analysis?</dt>
//               <dd><strong>Ans:</strong> 8–10mg</dd>
//               <dt><strong>Q2:</strong> Which gases are used for the analysis process?</dt>
//               <dd><strong>Ans:</strong> Nitrogen</dd>
//               <dt><strong>Q3:</strong> Which type of sample pan is used in DSC?</dt>
//               <dd><strong>Ans:</strong> Aluminium type</dd>
//             </dl>
//           `
//     },
//     {
//       question: 'Powder X-ray Diffractometer (XRD)',
//       isOpen: false,
//       answer: `
//             <dl>
//               <dt><strong>Q1:</strong> Can I use the sample after XRD analysis?</dt>
//               <dd><strong>Ans:</strong> Yes! XRD is non-destructive. The sample can be reused.</dd>
//               <dt><strong>Q2:</strong> I have an unknown mineral sample. Can I use XRD to identify it?</dt>
//               <dd><strong>Ans:</strong> Yes! XRD can identify crystal patterns or phases. For better results, run XRF first to know composition.</dd>
//               <dt><strong>Q3:</strong> Which databases are available?</dt>
//               <dd><strong>Ans:</strong> ICSD, PDF2 ICDD (JCPDS), Software: Highscore Plus</dd>
//               <dt><strong>Q4:</strong> What amount of sample is required?</dt>
//               <dd><strong>Ans:</strong> Powder: Minimum 400–500 mg</dd>
//             </dl>
//           `
//     },
//     {
//       question: 'FTIR Spectrometer',
//       isOpen: false,
//       answer: `
//             <dl>
//               <dt><strong>Q1:</strong> What type of samples can be analyzed?</dt>
//               <dd><strong>Ans:</strong> Powder and Liquid samples</dd>
//               <dt><strong>Q2:</strong> Can we analyze liquid samples?</dt>
//               <dd><strong>Ans:</strong> Yes</dd>
//               <dt><strong>Q3:</strong> In which ranges can we obtain IR spectra?</dt>
//               <dd><strong>Ans:</strong> 4000–400 cm-1</dd>
//               <dt><strong>Q4:</strong> How much sample is required?</dt>
//               <dd><strong>Ans:</strong> 5–10 mg</dd>
//             </dl>
//           `
//     },
//     {
//       question: 'Gas Chromatography with Mass Spectrometry (GC-MS/MS)',
//       isOpen: false,
//       answer: `
//             <dl>
//               <dt><strong>Q1:</strong> Can gas samples be analyzed?</dt>
//               <dd><strong>Ans:</strong> No, only solid and liquid samples</dd>
//               <dt><strong>Q2:</strong> Do I have to submit reference standards?</dt>
//               <dd><strong>Ans:</strong> Yes, required for quantitative analysis</dd>
//               <dt><strong>Q3:</strong> Are results provided with library comparison?</dt>
//               <dd><strong>Ans:</strong> Yes, NIST library comparison data is provided</dd>
//               <dt><strong>Q4:</strong> Can direct injection mass spectra be obtained?</dt>
//               <dd><strong>Ans:</strong> Yes, using MS/MS in CIF</dd>
//             </dl>
//           `
//     },
//     {
//       question: 'High Performance Liquid Chromatography (HPLC)',
//       isOpen: false,
//       answer: `
//             <dl>
//               <dt><strong>Q1:</strong> What is the minimum quantity required?</dt>
//               <dd><strong>Ans:</strong> Powder: 5–10 mg; Liquid: Minimum 2 ml final dilution</dd>
//               <dt><strong>Q2:</strong> Do I have to submit reference standards?</dt>
//               <dd><strong>Ans:</strong> Yes, required for quantitative analysis</dd>
//               <dt><strong>Q3:</strong> What detectors are available?</dt>
//               <dd><strong>Ans:</strong> PDA (Photo Diode Array), RID (Refractive Index Detector)</dd>
//             </dl>
//           `
//     },
//     {
//       question: 'Particle Size Analyser (Zetasizer Nano)',
//       isOpen: false,
//       answer: `
//             <dl>
//               <dt><strong>Q1:</strong> What are some specifications?</dt>
//               <dd><strong>Ans:</strong> Laser λ=633 nm, Temp 2°C–90°C</dd>
//               <dt><strong>Q2:</strong> What cuvettes are available?</dt>
//               <dd><strong>Ans:</strong> Quartz low volume, Disposable polystyrene, Folded capillary cuvettes</dd>
//               <dt><strong>Q3:</strong> What sample volume is needed?</dt>
//               <dd><strong>Ans:</strong> 1 ml (polystyrene), 0.75 ml (capillary), 12 μL (quartz)</dd>
//               <dt><strong>Q4:</strong> What is a good concentration?</dt>
//               <dd><strong>Ans:</strong> Depends on particle properties and polydispersity</dd>
//             </dl>
//           `
//     },
//     {
//       question: 'Fluorescence Spectrometer',
//       isOpen: false,
//       answer: `
//             <dl>
//               <dt><strong>Q1:</strong> What type of samples can be analyzed?</dt>
//               <dd><strong>Ans:</strong> Powder and Liquid</dd>
//               <dt><strong>Q2:</strong> How much sample is required?</dt>
//               <dd><strong>Ans:</strong> Powder: 200 mg; Liquid: 2 ml</dd>
//               <dt><strong>Q3:</strong> Do I need excitation/emission ranges?</dt>
//               <dd><strong>Ans:</strong> Yes, must be provided</dd>
//               <dt><strong>Q4:</strong> What if I don’t know the wavelength region?</dt>
//               <dd><strong>Ans:</strong> Run UV spectroscopy first; fluorescence follows UV peaks</dd>
//             </dl>
//           `
//     },
//     {
//       question: 'ICP-OES',
//       isOpen: false,
//       answer: `
//             <dl>
//               <dt><strong>Q1:</strong> Should I submit final dilution?</dt>
//               <dd><strong>Ans:</strong> Yes, only final diluted sample with digestion is accepted</dd>
//               <dt><strong>Q2:</strong> What is the minimum quantity required?</dt>
//               <dd><strong>Ans:</strong> 40–50 ml final dilution</dd>
//               <dt><strong>Q3:</strong> Do I need reference standards?</dt>
//               <dd><strong>Ans:</strong> Yes, required for quantitative analysis</dd>
//             </dl>
//           `
//     },
//     {
//       question: 'Electrochemical Workstation',
//       isOpen: false,
//       answer: `
//             <dl>
//               <dt><strong>Q1:</strong> What areas are covered?</dt>
//               <dd><strong>Ans:</strong> Supercapacitors, Batteries, Biosensors, Corrosion, Electrodepositions</dd>
//               <dt><strong>Q2:</strong> Do you provide photo-sensitive measurements?</dt>
//               <dd><strong>Ans:</strong> No, light source not available</dd>
//               <dt><strong>Q3:</strong> Which electrodes are provided?</dt>
//               <dd><strong>Ans:</strong> Ag/AgCl, Platinum wire, Glass carbon, Carbon electrodes</dd>
//               <dt><strong>Q4:</strong> Do I need to provide parameters?</dt>
//               <dd><strong>Ans:</strong> Yes, must be provided</dd>
//               <dt><strong>Q5:</strong> Do you prepare working electrodes?</dt>
//               <dd><strong>Ans:</strong> Normally provided by user; may be prepared with extra charges</dd>
//               <dt><strong>Q6:</strong> Can I reuse samples?</dt>
//               <dd><strong>Ans:</strong> Depends case by case; ask operator</dd>
//             </dl>
//           `
//     },
//     {
//       question: 'Viscometer',
//       isOpen: false,
//       answer: `
//             <dl>
//               <dt><strong>Q1:</strong> Can I analyse solid samples?</dt>
//               <dd><strong>Ans:</strong> No, only liquids (free-flowing or slightly viscous)</dd>
//               <dt><strong>Q2:</strong> Can I analyse liquid samples at high temperature?</dt>
//               <dd><strong>Ans:</strong> No, only ambient temperature</dd>
//               <dt><strong>Q3:</strong> How much sample is required?</dt>
//               <dd><strong>Ans:</strong> At least 40–50 ml liquid</dd>
//             </dl>
//           `
//     }
//   ];

//   toggleAccordion(selectedFaq: FAQ): void {
//     selectedFaq.isOpen = !selectedFaq.isOpen;
//     this.faqs.forEach(faq => {
//       if (faq !== selectedFaq) faq.isOpen = false;
//     });
//     this.cdr.detectChanges();
//   }

//   goto(val: any): void {
//     this.router.navigateByUrl(val);
//   }




 
//   openSampleInstructions() {
//     swal.fire({
//       title: 'Send Samples at Following Address :',
//       html: `
//            <address>
//             <div class="contact-text">
//            Central Instrumentation Facility (CIF) <br/>
//           Lovely Professional University <br/>
//           Block-38, Room No.106 <br/>
//           Jalandhar - Delhi G.T. Road, <br/>
//           Phagwara, Punjab (India) - 144411 <br/>
//           Phone : <a href="tel:+911824444021">+91 1824-444021</a><br>
//           Email : cif@lpu.co.in<br>
//           </div>
//            </address>`,
//       icon: 'info'
//     });
 
   
//  }
//  loadingStates: boolean[] = []; 
 
//   VisitUrl(Sufix: any, name: any, Id: any, catId: any) {
//     this.router.navigateByUrl(Sufix + '/' + name + '/' + Id + '/' + catId);
//   }
//   onImageLoad(index: number): void {
//     this.loadingStates[index] = false;  
//   }

  

//   onImageError(event: any, index: number): void {
//     event.target.src = '/image.jpg'; 
//     this.loadingStates[index] = false;
//   }

//  InstrumentsDataData: any[] = [];
//   tmpsInstrumentsDataData: any[] = []; tmpsResultData: any[] = [];
//   getAllInstrumentss(): void {
//     this.loadingIndicator=true;
//     const startTime = new Date().getTime();
//     this.CIFwebService.GetAllInstrumentsData().subscribe({
//       next: response => {
//         if (response.item1 && response.item1.length > 0) {
//           this.InstrumentsDataData = response.item1;
//           this.tmpsInstrumentsDataData = response.item1.slice(0, 8);
//           this.loadingStates = Array(this.tmpsInstrumentsDataData.length).fill(true); // Initialize loading states
//         } else {
//           this.InstrumentsDataData = [];
//         }
//         const elapsed = new Date().getTime() - startTime;
//         const remainingDelay = Math.max(2500 - elapsed, 0); // wait at least 5s

//         setTimeout(() => {
//           this.loadingIndicator = false;
//         }, remainingDelay);
//       },
//       error: err => {
//         this.loadingIndicator = false;
//         console.error(err);
//       }
//     });
//   }
 

//   // added on 21-aug-25
//   chunkedEvents: any[][] = [];

//   chunkArray(arr: any[], size: number): any[][] {
//     return arr.reduce((acc, _, i) => 
//       (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
//   }
// }




// //   toggleAccion(selectedFaq: FAQ): void {
// //     this.faqs.forEach(faq => {
// //       faq.isOpen = faq === selectedFaq ? !faq.isOpen : false;
// //     });
// //   }
// //   toggleAccordion(selectedFaq: FAQ): void {
// //     selectedFaq.isOpen = !selectedFaq.isOpen;
// //     this.faqs.forEach(faq => {
// //       if (faq !== selectedFaq) faq.isOpen = false;
// //     });

// //     this.cdr.detectChanges();
// //   }


// //   goto(val: any): void {
// //     this.router.navigateByUrl(val);
// //   }
// // }
