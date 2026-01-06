import { ChangeDetectorRef, Component, DOCUMENT, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import swal from 'sweetalert2';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { TopBar } from "../top-bar/top-bar";

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  imports: [TopBar],
})
export class HomePage implements OnInit {
  @ViewChild('facilitiesSection') facilitiesSection!: ElementRef;
  loadingIndicator: boolean = false;
  i: any;

  gotoFacilities() {
    this.facilitiesSection.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  ResultData: any[] = []; currentPage = 1; itemsPerPage = 10; InstrumentsDataData: any[] = [];
  tmpsInstrumentsDataData: any[] = []; tmpsResultData: any[] = [];
  InstrumentId: any; instrumentName: any = ''; UserRole: any; UserId: any; uploadEnabled: boolean | undefined; Remarks: any; dataSource: any;
  Description: any; ImageUrl: any;
  loadingStates: boolean[] = []; ServerUrl: any; isLoading: boolean = false; loadedCount: number = 0;

  constructor(
    private CIFwebService: LpuCIFWebService,
    private fb: FormBuilder,
    private cdRef: ChangeDetectorRef,
    @Inject(DOCUMENT) document: Document,
    private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.getAllInstruments();
    this.chunkedEvents = this.chunkArray(this.events, 3);
  }

  openSampleInstructions() {
    swal.fire({
      title: 'Send Samples at Following Address :',
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

  goto(val: any): void {
    this.router.navigateByUrl(val);
  }
  VisitUrl(Sufix: any, name: any, Id: any, catId: any) {
    this.router.navigateByUrl(`${Sufix}/${encodeURIComponent(name.slice(0, 10))}/${Id}/${catId}`);
  }
  onImageLoad(index: number): void {
    this.loadingStates[index] = false;
  }

  onImageError(event: any, index: number): void {
    event.target.src = '/image.jpg';
    this.loadingStates[index] = false;
  }

  getAllInstruments(): void {
    this.loadingIndicator = true;
    this.isLoading = true;
    const startTime = new Date().getTime();

    this.CIFwebService.GetAllInstrumentsData().subscribe({
      next: response => {
        if (response.item1 && response.item1.length > 0) {
          this.InstrumentsDataData = response.item1;
          this.tmpsInstrumentsDataData = response.item1;
          // this.tmpsInstrumentsDataData = response.item1.slice(0, 8);
          this.loadingStates = Array(this.tmpsInstrumentsDataData.length).fill(true);
        } else {
          this.InstrumentsDataData = [];
          this.tmpsInstrumentsDataData = [];
          this.loadingStates = [];
        }

        const elapsed = new Date().getTime() - startTime;
        const remainingDelay = Math.max(2500 - elapsed, 0);

        setTimeout(() => {
          this.loadingIndicator = false;
          this.isLoading = false;
          this.cdRef.detectChanges();
        }, remainingDelay);
      },
      error: err => {
        this.loadingIndicator = false;
        this.isLoading = false;
        this.cdRef.detectChanges();
        console.error(err);
      }
    });

  }
  chunkedEvents: any[][] = [];


  chunkArray(arr: any[], size: number): any[][] {
    return arr.reduce((acc, _, i) =>
      (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
  }
  serverUrl: any = 'https://www.lpu.in/lpu-assets/images/cif/';
  events = [
    {
      img: 'summer-training-programme-2025.webp',
      title: 'ANRF Sponsored Summer Training Programme',
      date: '(2 June - 11 July 2025)'
    },
    {
      img: 'event-10.jpg',
      title: 'Discovering the Crystalline and Nano world using X-ray Diffraction and Particle Size and Zeta Potential Analyzer: A National Workshop',
      date: '(24 - 26 April 2025)'
    },
    {
      img: 'event-9.jpg',
      title: 'National Workshop on Advance Research with Field Emission Scanning Electron Microscopy: Exploring the Nano-Structural Imaging',
      date: '(27 - 29 March 2025)'
    },
    {
      img: 'event-7.jpg',
      title: 'National Workshop on Advanced Chromatographic Techniques Theory & Applications',
      date: '(19 - 21 September, 2024)'
    },
    {
      img: 'event-8.jpg',
      title: 'SHORT-TERM COURSE on Advanced Materials analysis & Characterization Techniques: Hands-on-Training and Data Interpretation',
      date: '(09 - 13 December, 2024)'
    },
    {
      img: 'event-1.jpg',
      title: 'National workshop on X-Ray Diffraction and Particle Size Analyzer',
      date: '(26 - 27 April 2024)'
    },
    {
      img: 'event-2.jpg',
      title: 'Summer Training Programme',
      date: '(3 June - 13 July 2024)'
    },
    {
      img: 'event-3.jpg',
      title: 'Workshop on Field Emission Scanning Electron Microscope',
      date: '(29 - 30 March 2024)'
    },
    {
      img: 'summer-training-programme-2025.webp',
      title: 'ANRF Sponsored Summer Training Programme',
      date: '(2 June - 11 July 2025)'
    },
  ];

  get eventGroups() {
    const groups = [];
    for (let i = 0; i < this.events.length; i += 3) {
      groups.push(this.events.slice(i, i + 3));
    }
    return groups;
  }




  testClick(a: any): void {
    const fileName = `${a}.pdf`;
    const fileUrl = `assets/CifDocumentsTemplates/${fileName}`;

    fetch(fileUrl, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          const link = document.createElement('a');
          link.href = fileUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
        }
      })
      .catch(error => {
        alert('Error downloading file');
      });
  }
  isDisabled: any = true;
  showSearchForm: boolean = false; show: boolean = true; isSearchOpen: boolean = false;
  toggleSearchForm() {
    this.showSearchForm = !this.showSearchForm;
    this.show = !this.show;
  }

}