import {  animate,  state,  style,  transition,  trigger,} from '@angular/animations';
import {  ChangeDetectionStrategy,  Component,  ElementRef,  inject,  OnInit,  signal,  TemplateRef,  ViewChild,} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import swal from 'sweetalert2';

import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { Specification } from './specification.model';
import { TopBar } from '../top-bar/top-bar';

export interface FAQ {
  question: string;
  isOpen: boolean;
  answer: string;
}
export interface InstrumentItem {
  id: number;
  instrumentId: number;
  instrumentName: string;
  categoryId: number;
  isActive: boolean;
  description: string | null;
  imageUrl: string;
}
export interface ChargeItem {
  orgTypeId: number;
  sampleText: string;
  price: number;
}

const STATIC_INSTRUMENTS: InstrumentItem[] = [
  { id: 1, instrumentId: 0, categoryId: 1, isActive: true, instrumentName: 'Field Emission Scanning Electron Microscope, FESEM JEOL JSM-7610F-PLUS', description: 'The Jeol field emission scanning electron microscope is a versatile high resolution scanning electron microscope…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_23899918_2_2025_100006_FESEM-Instrument.JPG' },
  { id: 2, instrumentId: 0, categoryId: 2, isActive: true, instrumentName: 'Powder XRD (Bruker D8 Advance)', description: 'This Bruker equipment benchmark when it comes to extracting structural information from X-Ray Powder Diffraction…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_2005552723_2_2025_100009_XRD-Instrument.JPG' },
  { id: 3, instrumentId: 0, categoryId: 3, isActive: true, instrumentName: 'FTIR with Diamond ATR & Pellet accessories (Perkin Elmer Spectrum 2)', description: 'In Infrared spectroscopy or vibrational spectroscopy is used to study the chemical composition of a sample…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_926534728_2_2025_100014_FTIR-Instrument.JPG' },
  { id: 4, instrumentId: 0, categoryId: 4, isActive: true, instrumentName: 'Fluorescence Spectrometer (Perkin Elmer LS6500)', description: 'Fluorescence spectrophotometry is a technique that analyse the state of sample…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1449097689_2_2025_100011_Flourescence-Instrument.JPG' },
  { id: 5, instrumentId: 0, categoryId: 5, isActive: true, instrumentName: 'Thermogravimetric analyzer (Perkin Elmer TGA 4000)', description: 'Thermogravimetric analysis is an equipment that measures the change in weight…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_543001469_2_2025_100012_TGA-Instrument.JPG' },
  { id: 6, instrumentId: 0, categoryId: 6, isActive: true, instrumentName: 'Differential scanning calorimeter (Perkin Elmer DSC 6000)', description: 'Differential Scanning Calorimetry is a thermal analysis technique…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1507892084_2_2025_100013_DSC-Instrument.JPG' },
  { id: 9, instrumentId: 0, categoryId: 7, isActive: true, instrumentName: 'Gas Chromatography and Mass Spectroscopy, Shimadzu GCMS TQ8040 NX', description: 'The Gas Chromatograph - Mass Spectrometer, Shimadzu…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_2009182246_2_2025_100008_GCMS-Instrument.JPG' },
  { id: 10, instrumentId: 0, categoryId: 8, isActive: true, instrumentName: 'High Performance and Liquid Chromatography, Shimadzu Prominence LPGE', description: 'This Shimadzu equipment is used in the analysis of pharmaceutical…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_34620374_2_2025_100007_HPLC-Instrument.JPG' },
  { id: 11, instrumentId: 0, categoryId: 9, isActive: true, instrumentName: 'Electrochemical workstation, Metrohm: Multi-Channel Autolab AUT.MAC.204', description: 'Metrohum is a multi-channel Potentiostat/galvanostat…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1060204202_3_2026_100000_ADP_2248.JPG' },
  { id: 12, instrumentId: 0, categoryId: 10, isActive: true, instrumentName: 'Density merer (Axis Density Meter with analytical balance ALN-220)', description: 'Density Meter with analytical balance…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_382530855_2_2025_100002_Density_Meter-Instrument.jpg' },
  { id: 13, instrumentId: 0, categoryId: 11, isActive: true, instrumentName: 'Refrigerated Centrifuge (Eppendorf 5804R)', description: 'Refrigerated Centrifuge is a high speed centrifuge for medium capacity needs…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_259413724_2_2025_100003_Refrigerated_Centirfuge-Instrument.JPG' },
  { id: 14, instrumentId: 0, categoryId: 12, isActive: true, instrumentName: 'Viscometer (LABMAN model of LMDV-200 with small sample adaptor low viscosity adaptor and software.)', description: 'This Labman machine is Rotational Digital Direct Reading Viscometer…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_696381150_2_2025_100001_ADP_2298---.JPG' },
  { id: 15, instrumentId: 0, categoryId: 13, isActive: true, instrumentName: 'Particle size and Zeta potential analyzer (Malverrn Zetasizer Nano ZS90)', description: 'Light scattering is a fundamental analytical technique…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_284316046_2_2025_100010_Particle_Size-Instrument.JPG' },
  { id: 21, instrumentId: 0, categoryId: 14, isActive: true, instrumentName: 'Shimadzu UV-1800 UV-Vis', description: 'The UV-1800 is an advanced high-resolution spectrophotometer…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1208223655_17_2025_100004_-14-UV.JPG' },
  { id: 22, instrumentId: 0, categoryId: 15, isActive: true, instrumentName: 'ICP-OES, PerkinElmer Optima 8000', description: 'The Optima 8000 is a bench-top, dual-view ICP-OES…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_323568347_3_2025_100005_ICP-OES-Instrument-21.jpg' },
  { id: 23, instrumentId: 0, categoryId: 0, isActive: true, instrumentName: 'Distilled Water (milli-Q water)', description: null, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_507378691_3_2025_100015_noImage.jpg' },
];

const STATIC_SPECIFICATIONS: Specification[] = [
  { id: 1, categoryId: 1, keyName: 'Model', keyValue: 'JEOL JSM-7610F-PLUS', specificationType: 'General' },
  { id: 2, categoryId: 1, keyName: 'Resolution', keyValue: '1.0 nm at 15 kV', specificationType: 'Performance' },
  { id: 3, categoryId: 1, keyName: 'Magnification', keyValue: '25x to 1,000,000x', specificationType: 'Performance' },
  { id: 4, categoryId: 1, keyName: 'Accelerating Voltage', keyValue: '0.1 to 30 kV', specificationType: 'General' },
  { id: 5, categoryId: 2, keyName: 'Model', keyValue: 'Bruker D8 Advance', specificationType: 'General' },
  { id: 6, categoryId: 2, keyName: 'X-ray Source', keyValue: 'Cu Kα (λ = 1.5406 Å)', specificationType: 'General' },
  { id: 7, categoryId: 2, keyName: '2θ Range', keyValue: '0° to 160°', specificationType: 'Performance' },
  { id: 8, categoryId: 2, keyName: 'Detector', keyValue: 'LYNXEYE XE-T', specificationType: 'General' },
  { id: 9, categoryId: 3, keyName: 'Model', keyValue: 'Perkin Elmer Spectrum 2', specificationType: 'General' },
  { id: 10, categoryId: 3, keyName: 'Spectral Range', keyValue: '4000 - 400 cm⁻¹', specificationType: 'Performance' },
  { id: 11, categoryId: 3, keyName: 'Resolution', keyValue: '0.5 cm⁻¹', specificationType: 'Performance' },
  { id: 12, categoryId: 3, keyName: 'Accessory', keyValue: 'Diamond ATR', specificationType: 'General' },
  { id: 13, categoryId: 4, keyName: 'Model', keyValue: 'Perkin Elmer LS6500', specificationType: 'General' },
  { id: 14, categoryId: 4, keyName: 'Excitation Range', keyValue: '200 - 800 nm', specificationType: 'Performance' },
  { id: 15, categoryId: 4, keyName: 'Emission Range', keyValue: '200 - 900 nm', specificationType: 'Performance' },
  { id: 16, categoryId: 5, keyName: 'Model', keyValue: 'Perkin Elmer TGA 4000', specificationType: 'General' },
  { id: 17, categoryId: 5, keyName: 'Temperature Range', keyValue: 'Ambient to 1000°C', specificationType: 'Performance' },
  { id: 18, categoryId: 5, keyName: 'Heating Rate', keyValue: '0.1 - 200°C/min', specificationType: 'Performance' },
  { id: 19, categoryId: 6, keyName: 'Model', keyValue: 'Perkin Elmer DSC 6000', specificationType: 'General' },
  { id: 20, categoryId: 6, keyName: 'Temperature Range', keyValue: '-180°C to 750°C', specificationType: 'Performance' },
  { id: 21, categoryId: 6, keyName: 'Heating Rate', keyValue: '0.01 - 100°C/min', specificationType: 'Performance' },
  { id: 22, categoryId: 7, keyName: 'Model', keyValue: 'Shimadzu GCMS TQ8040 NX', specificationType: 'General' },
  { id: 23, categoryId: 7, keyName: 'Mass Range', keyValue: '1.5 - 1100 m/z', specificationType: 'Performance' },
  { id: 24, categoryId: 7, keyName: 'Ionization', keyValue: 'EI (Electron Ionization)', specificationType: 'General' },
  { id: 25, categoryId: 8, keyName: 'Model', keyValue: 'Shimadzu Prominence LPGE', specificationType: 'General' },
  { id: 26, categoryId: 8, keyName: 'Detectors', keyValue: 'PDA, RID', specificationType: 'General' },
  { id: 27, categoryId: 8, keyName: 'Flow Rate', keyValue: '0.001 - 10 mL/min', specificationType: 'Performance' },
  { id: 28, categoryId: 9, keyName: 'Model', keyValue: 'Metrohm Autolab AUT.MAC.204', specificationType: 'General' },
  { id: 29, categoryId: 9, keyName: 'Channels', keyValue: 'Multi-Channel', specificationType: 'General' },
  { id: 30, categoryId: 9, keyName: 'Frequency Range', keyValue: '10 µHz to 32 MHz', specificationType: 'Performance' },
  { id: 31, categoryId: 10, keyName: 'Model', keyValue: 'Axis Density Meter ALN-220', specificationType: 'General' },
  { id: 32, categoryId: 10, keyName: 'Balance Type', keyValue: 'Analytical', specificationType: 'General' },
  { id: 33, categoryId: 11, keyName: 'Model', keyValue: 'Eppendorf 5804R', specificationType: 'General' },
  { id: 34, categoryId: 11, keyName: 'Max Speed', keyValue: '14,000 rpm', specificationType: 'Performance' },
  { id: 35, categoryId: 11, keyName: 'Temperature Range', keyValue: '-9°C to 40°C', specificationType: 'Performance' },
  { id: 36, categoryId: 12, keyName: 'Model', keyValue: 'LABMAN LMDV-200', specificationType: 'General' },
  { id: 37, categoryId: 12, keyName: 'Speed Range', keyValue: '0.3 - 100 rpm', specificationType: 'Performance' },
  { id: 38, categoryId: 13, keyName: 'Model', keyValue: 'Malvern Zetasizer Nano ZS90', specificationType: 'General' },
  { id: 39, categoryId: 13, keyName: 'Size Range', keyValue: '0.3 nm - 10 µm', specificationType: 'Performance' },
  { id: 40, categoryId: 13, keyName: 'Laser', keyValue: '633 nm He-Ne', specificationType: 'General' },
  { id: 41, categoryId: 14, keyName: 'Model', keyValue: 'Shimadzu UV-1800', specificationType: 'General' },
  { id: 42, categoryId: 14, keyName: 'Wavelength Range', keyValue: '190 - 1100 nm', specificationType: 'Performance' },
  { id: 43, categoryId: 14, keyName: 'Resolution', keyValue: '1 nm', specificationType: 'Performance' },
  { id: 44, categoryId: 15, keyName: 'Model', keyValue: 'PerkinElmer Optima 8000', specificationType: 'General' },
  { id: 45, categoryId: 15, keyName: 'Detector', keyValue: 'DBI-CCD Array', specificationType: 'General' },
  { id: 46, categoryId: 15, keyName: 'Wavelength Range', keyValue: '165 - 850 nm', specificationType: 'Performance' },
];

@Component({
  selector: 'app-cif-instruments',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe, TopBar],
  templateUrl: './CifInstruments.component.html',
  styleUrls: ['./CifInstruments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideInOut', [
      state('void', style({ height: '0px', opacity: 0 })),
      state('*', style({ height: '*', opacity: 1 })),
      transition('void <=> *', animate('300ms ease-in-out')),
    ]),
  ],
})
export class CifInstrumentsComponent implements OnInit {


  private readonly cifWebService = inject(LpuCIFWebService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly modalService = inject(NgbModal);

  readonly loadingIndicator       = signal(false);
  readonly isLoading              = signal(true);

  @ViewChild('facilitiesSection') facilitiesSection!: ElementRef;
  @ViewChild('chargesModal') chargesModal!: TemplateRef<unknown>;


  readonly instrumentList = signal<InstrumentItem[]>([]);
  readonly facilityList = signal<InstrumentItem[]>([]);
  readonly loadingStates = signal<boolean[]>([]);
  readonly selectedInstrumentId = signal<number | null>(null);


  readonly isInstrumentActive = signal(false);
  readonly instrumentStatus = signal('');
  readonly instrumentName = signal('');
  readonly imageUrl = signal('');
  readonly description = signal('');
  readonly specifications = signal<Specification[]>([]);


  readonly cifInstrumentsCharges = signal<ChargeItem[]>([]);


  readonly faqs = signal<FAQ[]>([
    {
      question: 'Field Emission Scanning Electron Microscope (FE SEM)',
      isOpen: false,
      answer: `<dl>
        <dt><strong>Q1:</strong> How many samples can be submitted in a single request form?</dt>
        <dd><strong>Ans:</strong> Maximum of 5 samples</dd>
        <dt><strong>Q2:</strong> Does the Gold sputtering process affect the sample?</dt>
        <dd><strong>Ans:</strong> No, the process only creates a very thin coating on the sample surface to enhance the conductivity for good imaging.</dd>
        <dt><strong>Q3:</strong> What amount of sample is required for FESEM?</dt>
        <dd><strong>Ans:</strong> Powder: Minimum of 2.5 to 5mg. Film: Maximum allowed size 1cm x 1cm.</dd>
        <dt><strong>Q4:</strong> How will we come to know about the slot allocation?</dt>
        <dd><strong>Ans:</strong> The concerned operator/office assistant will intimate you at least a week before your slot by calling you.</dd>
      </dl>`,
    },
    {
      question: 'UV-Vis Spectrophotometer',
      isOpen: false,
      answer: `<dl>
        <dt><strong>Q1:</strong> What wavelength range is used for your UV-Vis instrument?</dt><dd><strong>Ans:</strong> 200 nm to 800 nm</dd>
        <dt><strong>Q2:</strong> Can I reuse the sample after the analysis for other experiments?</dt><dd><strong>Ans:</strong> Yes, if your sample is not UV sensitive you can reuse it. UV-Vis spectrometer analysis is a non-destructive method.</dd>
        <dt><strong>Q3:</strong> Is it necessary to provide final dilution of sample for UV analysis?</dt><dd><strong>Ans:</strong> Yes, user must provide the sample in final diluted form.</dd>
      </dl>`,
    },
    {
      question: 'Thermogravimetric Analysis (TGA)',
      isOpen: false,
      answer: `<dl>
        <dt><strong>Q1:</strong> How much sample is required for TGA analysis?</dt><dd><strong>Ans:</strong> 5–8mg</dd>
        <dt><strong>Q2:</strong> What is the normally used heating rate in TGA analysis?</dt><dd><strong>Ans:</strong> 10°C/Min</dd>
        <dt><strong>Q3:</strong> Can we do TGA analysis of Liquid samples?</dt><dd><strong>Ans:</strong> No! TGA analysis can only be performed on Powder or Film samples.</dd>
        <dt><strong>Q4:</strong> What is the maximum possible heating range?</dt><dd><strong>Ans:</strong> 1000°C</dd>
      </dl>`,
    },
    {
      question: 'Differential Scanning Calorimeter (DSC)',
      isOpen: false,
      answer: `<dl>
        <dt><strong>Q1:</strong> How much sample is required for DSC analysis?</dt><dd><strong>Ans:</strong> 8–10mg</dd>
        <dt><strong>Q2:</strong> Which gases are used for the analysis process?</dt><dd><strong>Ans:</strong> Nitrogen</dd>
        <dt><strong>Q3:</strong> Which type of sample pan is used in DSC?</dt><dd><strong>Ans:</strong> Aluminium type</dd>
      </dl>`,
    },
    {
      question: 'Powder X-ray Diffractometer (XRD)',
      isOpen: false,
      answer: `<dl>
        <dt><strong>Q1:</strong> Can I use the sample after XRD analysis?</dt><dd><strong>Ans:</strong> Yes! XRD is non-destructive. The sample can be reused.</dd>
        <dt><strong>Q2:</strong> I have an unknown mineral sample. Can I use XRD to identify it?</dt><dd><strong>Ans:</strong> Yes! XRD can identify crystal patterns or phases.</dd>
        <dt><strong>Q3:</strong> Which databases are available?</dt><dd><strong>Ans:</strong> ICSD, PDF2 ICDD (JCPDS), Software: Highscore Plus</dd>
        <dt><strong>Q4:</strong> What amount of sample is required?</dt><dd><strong>Ans:</strong> Powder: Minimum 400–500 mg</dd>
      </dl>`,
    },
    {
      question: 'FTIR Spectrometer',
      isOpen: false,
      answer: `<dl>
        <dt><strong>Q1:</strong> What type of samples can be analyzed?</dt><dd><strong>Ans:</strong> Powder and Liquid samples</dd>
        <dt><strong>Q2:</strong> Can we analyze liquid samples?</dt><dd><strong>Ans:</strong> Yes</dd>
        <dt><strong>Q3:</strong> In which ranges can we obtain IR spectra?</dt><dd><strong>Ans:</strong> 4000–400 cm-1</dd>
        <dt><strong>Q4:</strong> How much sample is required?</dt><dd><strong>Ans:</strong> 5–10 mg</dd>
      </dl>`,
    },
    {
      question: 'Gas Chromatography with Mass Spectrometry (GC-MS/MS)',
      isOpen: false,
      answer: `<dl>
        <dt><strong>Q1:</strong> Can gas samples be analyzed?</dt><dd><strong>Ans:</strong> No, only solid and liquid samples</dd>
        <dt><strong>Q2:</strong> Do I have to submit reference standards?</dt><dd><strong>Ans:</strong> Yes, required for quantitative analysis</dd>
        <dt><strong>Q3:</strong> Are results provided with library comparison?</dt><dd><strong>Ans:</strong> Yes, NIST library comparison data is provided</dd>
        <dt><strong>Q4:</strong> Can direct injection mass spectra be obtained?</dt><dd><strong>Ans:</strong> Yes, using MS/MS in CIF</dd>
      </dl>`,
    },
    {
      question: 'High Performance Liquid Chromatography (HPLC)',
      isOpen: false,
      answer: `<dl>
        <dt><strong>Q1:</strong> What is the minimum quantity required?</dt><dd><strong>Ans:</strong> Powder: 5–10 mg; Liquid: Minimum 2 ml final dilution</dd>
        <dt><strong>Q2:</strong> Do I have to submit reference standards?</dt><dd><strong>Ans:</strong> Yes, required for quantitative analysis</dd>
        <dt><strong>Q3:</strong> What detectors are available?</dt><dd><strong>Ans:</strong> PDA (Photo Diode Array), RID (Refractive Index Detector)</dd>
      </dl>`,
    },
    {
      question: 'Particle Size Analyser (Zetasizer Nano)',
      isOpen: false,
      answer: `<dl>
        <dt><strong>Q1:</strong> What are some specifications?</dt><dd><strong>Ans:</strong> Laser λ=633 nm, Temp 2°C–90°C</dd>
        <dt><strong>Q2:</strong> What cuvettes are available?</dt><dd><strong>Ans:</strong> Quartz low volume, Disposable polystyrene, Folded capillary cuvettes</dd>
        <dt><strong>Q3:</strong> What sample volume is needed?</dt><dd><strong>Ans:</strong> 1 ml (polystyrene), 0.75 ml (capillary), 12 μL (quartz)</dd>
      </dl>`,
    },
    {
      question: 'Fluorescence Spectrometer',
      isOpen: false,
      answer: `<dl>
        <dt><strong>Q1:</strong> What type of samples can be analyzed?</dt><dd><strong>Ans:</strong> Powder and Liquid</dd>
        <dt><strong>Q2:</strong> How much sample is required?</dt><dd><strong>Ans:</strong> Powder: 200 mg; Liquid: 2 ml</dd>
        <dt><strong>Q3:</strong> Do I need excitation/emission ranges?</dt><dd><strong>Ans:</strong> Yes, must be provided</dd>
      </dl>`,
    },
    {
      question: 'ICP-OES',
      isOpen: false,
      answer: `<dl>
        <dt><strong>Q1:</strong> Should I submit final dilution?</dt><dd><strong>Ans:</strong> Yes, only final diluted sample with digestion is accepted</dd>
        <dt><strong>Q2:</strong> What is the minimum quantity required?</dt><dd><strong>Ans:</strong> 40–50 ml final dilution</dd>
        <dt><strong>Q3:</strong> Do I need reference standards?</dt><dd><strong>Ans:</strong> Yes, required for quantitative analysis</dd>
      </dl>`,
    },
    {
      question: 'Electrochemical Workstation',
      isOpen: false,
      answer: `<dl>
        <dt><strong>Q1:</strong> What areas are covered?</dt><dd><strong>Ans:</strong> Supercapacitors, Batteries, Biosensors, Corrosion, Electrodepositions</dd>
        <dt><strong>Q2:</strong> Do you provide photo-sensitive measurements?</dt><dd><strong>Ans:</strong> No, light source not available</dd>
        <dt><strong>Q3:</strong> Which electrodes are provided?</dt><dd><strong>Ans:</strong> Ag/AgCl, Platinum wire, Glass carbon, Carbon electrodes</dd>
      </dl>`,
    },
    {
      question: 'Viscometer',
      isOpen: false,
      answer: `<dl>
        <dt><strong>Q1:</strong> Can I analyse solid samples?</dt><dd><strong>Ans:</strong> No, only liquids (free-flowing or slightly viscous)</dd>
        <dt><strong>Q2:</strong> Can I analyse liquid samples at high temperature?</dt><dd><strong>Ans:</strong> No, only ambient temperature</dd>
        <dt><strong>Q3:</strong> How much sample is required?</dt><dd><strong>Ans:</strong> At least 40–50 ml liquid</dd>
      </dl>`,
    },
  ]);


  ngOnInit(): void {
     this.loadAllInstruments();
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      const categoryId = Number(params.get('categoryId'));
      if (id && categoryId) {
        this.fetchSpecifications(categoryId, id);
      }
    });
  }

  gotoFacilities(): void {
    this.facilitiesSection?.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  goto(path: string): void {
    this.router.navigateByUrl(path);
  }

  visitUrl(suffix: string, name: string, id: number, catId: number): void {
    this.router.navigateByUrl(`${suffix}/${name}/${id}/${catId}`);
  }

  onImageLoad(index: number): void {
    const states = [...this.loadingStates()];
    states[index] = false;
    this.loadingStates.set(states);
  }

  onImageError(event: Event, index: number): void {
    (event.target as HTMLImageElement).src = '/image.jpg';
    this.onImageLoad(index);
  }

  toggleAccordion(selected: FAQ): void {

    this.faqs.update(list =>
      list.map(faq => ({
        ...faq,
        isOpen: faq === selected ? !faq.isOpen : false,
      }))
    );
  }


  private loadAllInstruments(): void {
    this.isLoading.set(true); // Start global loader
     const startTime = Date.now();

    this.cifWebService.GetAllInstrumentsData().subscribe({
      next: (response) => {
        const rows = response?.item1?.length > 0 ? response.item1 : STATIC_INSTRUMENTS;
        this.instrumentList.set(rows);
        this.facilityList.set(rows);
        this.loadingStates.set(Array(rows.length).fill(true));
         const delay = Math.max(2500 - (Date.now() - startTime), 0);
        // Finalize page loading
        setTimeout(() => this.isLoading.set(false),delay); 
      },
      error: (err) => {
        this.instrumentList.set(STATIC_INSTRUMENTS);
        this.facilityList.set(STATIC_INSTRUMENTS);
        this.isLoading.set(false);
      },
    });
  }


  fetchSpecifications(categoryId: number, id: number): void {
    this.loadingIndicator.set(true); // Start background indicator
    this.selectedInstrumentId.set(id);

    const sourceList = this.instrumentList().length > 0 ? this.instrumentList() : STATIC_INSTRUMENTS;

    this.cifWebService.fetchSpecifications().subscribe({
      next: (response: any) => {
        if (response?.item1?.length > 0) {
          this.applyInstrumentDetail(sourceList, id, categoryId, response.item1);
        } else {
          this.applyStaticDetail(sourceList, categoryId);
        }
        this.loadingIndicator.set(false); // Stop indicator
      },
      error: (err) => {
        this.applyStaticDetail(sourceList, categoryId);
        this.loadingIndicator.set(false);
      },
    });
  }
  private applyInstrumentDetail(
    list: InstrumentItem[],
    id: number,
    categoryId: number,
    allSpecs: Specification[]
  ): void {
    const instrument = list.find(x => x.id === id);
    const isActive = list.some(x => x.isActive && x.id === id);

    this.isInstrumentActive.set(isActive || true);
    this.specifications.set(allSpecs.filter(s => s.categoryId === categoryId));

    if (instrument) {
      this.instrumentName.set(instrument.instrumentName);
      this.imageUrl.set(instrument.imageUrl);
      this.description.set(instrument.description ?? '');
    }
  }
  private applyStaticDetail(list: InstrumentItem[], categoryId: number): void {
    const instrument =
      list.find(x => x.categoryId === categoryId) ??
      STATIC_INSTRUMENTS.find(x => x.categoryId === categoryId);

    this.isInstrumentActive.set(true);
    this.specifications.set(
      STATIC_SPECIFICATIONS.filter(s => s.categoryId === categoryId)
    );

    if (instrument) {
      this.instrumentName.set(instrument.instrumentName);
      this.imageUrl.set(instrument.imageUrl);
      this.description.set(instrument.description ?? '');
    }
  }
  openChargesModal(id: number): void {
    this.loadChargesDetails(id);
    this.modalService.open(this.chargesModal, { size: 'lg' }).result
      .then(() => { })
      .catch(() => { });
  }

  private loadChargesDetails(id: number): void {
    this.cifWebService.GetChargesDetails(id).subscribe({
      next: (response) => {
        this.cifInstrumentsCharges.set(response?.item1 ?? []);
      },
      error: (err) => console.error('Charges API error:', err),
    });
  }

  navigateToLogin(): void {
    this.modalService.dismissAll();
    this.router.navigate(['/Login']);
  }

  openSampleInstructions(): void {
    swal.fire({
      title: 'Send Samples at Following Address:',
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
}