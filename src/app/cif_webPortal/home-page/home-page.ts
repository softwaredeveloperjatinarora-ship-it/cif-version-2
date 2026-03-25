import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import swal from 'sweetalert2';

import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { TopBar } from '../top-bar/top-bar';
 
const FALLBACK_INSTRUMENTS = [
  { id: 1,  instrumentId: 0, categoryId: 1,  isActive: true, instrumentName: 'Field Emission Scanning Electron Microscope, FESEM JEOL JSM-7610F-PLUS',        imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_23899918_2_2025_100006_FESEM-Instrument.JPG' },
  { id: 2,  instrumentId: 0, categoryId: 2,  isActive: true, instrumentName: 'Powder XRD (Bruker D8 Advance)',                                                  imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_2005552723_2_2025_100009_XRD-Instrument.JPG' },
  { id: 3,  instrumentId: 0, categoryId: 3,  isActive: true, instrumentName: 'FTIR with Diamond ATR & Pellet accessories (Perkin Elmer Spectrum 2)',             imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_926534728_2_2025_100014_FTIR-Instrument.JPG' },
  { id: 4,  instrumentId: 0, categoryId: 4,  isActive: true, instrumentName: 'Fluorescence Spectrometer (Perkin Elmer LS6500)',                                  imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1449097689_2_2025_100011_Flourescence-Instrument.JPG' },
  { id: 5,  instrumentId: 0, categoryId: 5,  isActive: true, instrumentName: 'Thermogravimetric analyzer (Perkin Elmer TGA 4000)',                               imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_543001469_2_2025_100012_TGA-Instrument.JPG' },
  { id: 6,  instrumentId: 0, categoryId: 6,  isActive: true, instrumentName: 'Differential scanning calorimeter (Perkin Elmer DSC 6000)',                        imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1507892084_2_2025_100013_DSC-Instrument.JPG' },
  { id: 9,  instrumentId: 0, categoryId: 7,  isActive: true, instrumentName: 'Gas Chromatography and Mass Spectroscopy, Shimadzu GCMS TQ8040 NX',               imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_2009182246_2_2025_100008_GCMS-Instrument.JPG' },
  { id: 10, instrumentId: 0, categoryId: 8,  isActive: true, instrumentName: 'High Performance and Liquid Chromatography, Shimadzu Prominence LPGE',            imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_34620374_2_2025_100007_HPLC-Instrument.JPG' },
  { id: 11, instrumentId: 0, categoryId: 9,  isActive: true, instrumentName: 'Electrochemical workstation, Metrohm: Multi-Channel Autolab AUT.MAC.204',         imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1060204202_3_2026_100000_ADP_2248.JPG' },
  { id: 12, instrumentId: 0, categoryId: 10, isActive: true, instrumentName: 'Density meter (Axis Density Meter with analytical balance ALN-220)',              imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_382530855_2_2025_100002_Density_Meter-Instrument.jpg' },
  { id: 13, instrumentId: 0, categoryId: 11, isActive: true, instrumentName: 'Refrigerated Centrifuge (Eppendorf 5804R)',                                        imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_259413724_2_2025_100003_Refrigerated_Centirfuge-Instrument.JPG' },
  { id: 23, instrumentId: 0, categoryId: 0,  isActive: true, instrumentName: 'Distilled Water (milli-Q water)',                                                  imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_507378691_3_2025_100015_noImage.jpg' },
];

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  standalone: true,
 
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [CommonModule, TopBar, NgbCarouselModule],
})
export class HomePage implements OnInit {

  private readonly cifWebService = inject(LpuCIFWebService);
  private readonly router        = inject(Router);
  private readonly route         = inject(ActivatedRoute);


  @ViewChild('facilitiesSection') facilitiesSection!: ElementRef;

  
  readonly loadingIndicator       = signal(false);
  readonly isLoading              = signal(true);
  readonly tmpsInstrumentsDataData = signal<typeof FALLBACK_INSTRUMENTS>([]);


  readonly loadingStates = signal<boolean[]>([]);


  readonly events = [
    { img: 'https://www.lpu.in/lpu-assets/images/cif/summer-training-programme-2025.webp', title: 'ANRF Sponsored Summer Training Programme',                                                                                                       date: '(2 June - 11 July 2025)'        },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-10.jpg',                        title: 'Discovering the Crystalline and Nano world using X-ray Diffraction and Particle Size and Zeta Potential Analyzer: A National Workshop',         date: '(24 - 26 April 2025)'           },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-9.jpg',                         title: 'National Workshop on Advance Research with Field Emission Scanning Electron Microscopy: Exploring the Nano-Structural Imaging',                 date: '(27 - 29 March 2025)'           },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-7.jpg',                         title: 'National Workshop on Advanced Chromatographic Techniques Theory & Applications',                                                                date: '(19 - 21 September, 2024)'      },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-8.jpg',                         title: 'SHORT-TERM COURSE on Advanced Materials analysis & Characterization Techniques: Hands-on-Training and Data Interpretation',                    date: '(09 - 13 December, 2024)'       },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-1.jpg',                         title: 'National workshop on X-Ray Diffraction and Particle Size Analyzer',                                                                             date: '(26 - 27 April 2024)'           },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-2.jpg',                         title: 'Summer Training Programme',                                                                                                                      date: '(3 June - 13 July 2024)'        },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-3.jpg',                         title: 'Workshop on Field Emission Scanning Electron Microscope',                                                                                       date: '(29 - 30 March 2024)'           },
  ];

  chunkedEvents: typeof this.events[] = [];


  ngOnInit(): void {
    this.chunkedEvents = this.chunkArray(this.events, 3);
    this.loadAllInstruments();
  }


  gotoFacilities(): void {
    this.facilitiesSection?.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  goto(path: string): void {
    this.router.navigateByUrl(path);
  }

  VisitUrl(suffix: string, name: string, id: number, catId: number): void {
    this.router.navigateByUrl(
      `${suffix}/${encodeURIComponent(name.slice(0, 10))}/${id}/${catId}`
    );
  }

  onImageLoad(index: number): void {
    this.loadingStates.update(states => {
      const updated = [...states];
      updated[index] = false;
      return updated;
    });
  }

  onImageError(event: Event, index: number): void {
    (event.target as HTMLImageElement).src = '/image.jpg';
    this.onImageLoad(index); // reuse same update logic
  }


  private loadAllInstruments(): void {
    this.loadingIndicator.set(true);
    this.isLoading.set(true);

    this.cifWebService.GetAllInstrumentsData().subscribe({
      next: (response) => {
        const rows =
          response?.item1?.length > 0 ? response.item1 : FALLBACK_INSTRUMENTS;

        this.tmpsInstrumentsDataData.set(rows);
        this.loadingStates.set(Array(rows.length).fill(true));
        this.loadingIndicator.set(false);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Instrument API failed, using fallback data:', err);
        this.tmpsInstrumentsDataData.set(FALLBACK_INSTRUMENTS);
        this.loadingStates.set(Array(FALLBACK_INSTRUMENTS.length).fill(true));
        this.loadingIndicator.set(false);
        this.isLoading.set(false);
      },
    });
  }


  chunkArray<T>(arr: T[], size: number): T[][] {
    return arr.reduce((acc: T[][], _, i) =>
      i % size === 0 ? [...acc, arr.slice(i, i + size)] : acc,
    []);
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





















































































 












         













































































































































