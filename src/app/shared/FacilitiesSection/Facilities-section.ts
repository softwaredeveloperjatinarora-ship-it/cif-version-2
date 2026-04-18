import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, inject, signal, } from '@angular/core';
import { ReactiveFormsModule, } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';

@Component({
    selector: 'app-Facilities-Section',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReactiveFormsModule, RouterLink, NgbCarouselModule,],
    templateUrl: './Facilities-section.html',
    styleUrls: ['./Facilities-section.scss'],
})
export class MFacilitiesSection implements OnInit {

    private readonly cifWebService = inject(LpuCIFWebService);
    private readonly router = inject(Router);

    readonly showPassword = signal(false);
    readonly loadingIndicator = signal(false);
    readonly isLoading = signal(true);
    
    readonly Details = signal<any[]>([]);

    loginError: string | null = null;
    isLoginFailed = false;
    serverConnectionError = false;
    instrumentsData: any[] = [];
     
    loadingStates: boolean[] = [];
    chunkedEvents: any[][] = [];
    @ViewChild('facilitiesSection') facilitiesSection!: ElementRef;


    ngOnInit(): void {
        this.getAllInstruments();
    }
    togglePasswordVisibility(): void {
        this.showPassword.update(v => !v);
    }

    checkUserType(event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        if (!value) { console.warn('Please select a valid role.'); }
    }

    gotoFacilities(): void {
        this.facilitiesSection?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }

    goto(path: string): void {
        this.router.navigateByUrl(path);
    }

    visitUrl(prefix: string, name: string, id: any, catId: any): void {
        this.router.navigateByUrl(`${prefix}/${name}/${id}/${catId}`);
    }

    gotoHome(): void {
        this.router.navigateByUrl('Home');
    }


    onImageLoad(index: number): void {
        this.loadingStates[index] = false;
    }

    onImageError(event: Event, index: number): void {
        (event.target as HTMLImageElement).src = '/image.jpg';
        this.loadingStates[index] = false;
    }

    getAllInstruments(): void {
        this.loadingIndicator.set(true);
        const startTime = Date.now();

        this.cifWebService.GetAllInstrumentsData().subscribe({
            next: (response) => {
                const items: any[] = response.item1?.length > 0 ? response.item1 : this.dataItems;
                this.instrumentsData = items;

                this.Details.set([...items]);

                this.loadingStates = Array(items.length).fill(true);
                if (!items.length) {
                    this.serverConnectionError = true;
                    this.loginError = 'Data Server Connection error, Try again later';
                }

                const delay = Math.max(800 - (Date.now() - startTime), 0);
                setTimeout(() => this.loadingIndicator.set(false), delay);
            },
            error: (err) => {
                console.error(err);
                this.instrumentsData = this.dataItems;
                this.Details.set([...this.dataItems]);
                this.loadingStates = Array(this.dataItems.length).fill(true);
                this.serverConnectionError = true;
                this.loginError = 'Data Server Connection error, Try again later';
                this.loadingIndicator.set(false);
            },
        });
    }

    readonly dataItems = [
        { id: 1, instrumentId: 0, instrumentName: 'Field Emission Scanning Electron Microscope, FESEM JEOL JSM-7610F-PLUS', categoryId: 1, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_23899918_2_2025_100006_FESEM-Instrument.JPG' },
        { id: 2, instrumentId: 0, instrumentName: 'Powder XRD (Bruker D8 Advance)', categoryId: 2, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_2005552723_2_2025_100009_XRD-Instrument.JPG' },
        { id: 3, instrumentId: 0, instrumentName: 'FTIR with Diamond ATR & Pellet accessories (Perkin Elmer Spectrum 2)', categoryId: 3, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_926534728_2_2025_100014_FTIR-Instrument.JPG' },
        { id: 4, instrumentId: 0, instrumentName: 'Fluorescence Spectrometer (Perkin Elmer LS6500)', categoryId: 4, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1449097689_2_2025_100011_Flourescence-Instrument.JPG' },
        { id: 5, instrumentId: 0, instrumentName: 'Thermogravimetric analyzer (Perkin Elmer TGA 4000)', categoryId: 5, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_543001469_2_2025_100012_TGA-Instrument.JPG' },
        { id: 6, instrumentId: 0, instrumentName: 'Differential scanning calorimeter (Perkin Elmer DSC 6000)', categoryId: 6, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1507892084_2_2025_100013_DSC-Instrument.JPG' },
        { id: 9, instrumentId: 0, instrumentName: 'Gas Chromatography and Mass Spectroscopy, Shimadzu GCMS TQ8040 NX', categoryId: 7, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_2009182246_2_2025_100008_GCMS-Instrument.JPG' },
        { id: 10, instrumentId: 0, instrumentName: 'High Performance and Liquid Chromatography, Shimadzu Prominence LPGE', categoryId: 8, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_34620374_2_2025_100007_HPLC-Instrument.JPG' },
        { id: 11, instrumentId: 0, instrumentName: 'Electrochemical workstation, Metrohm: Multi-Channel Autolab AUT.MAC.204', categoryId: 9, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1060204202_3_2026_100000_ADP_2248.JPG' },
        { id: 12, instrumentId: 0, instrumentName: 'Density meter (Axis Density Meter with analytical balance ALN-220)', categoryId: 10, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_382530855_2_2025_100002_Density_Meter-Instrument.jpg' },
        { id: 13, instrumentId: 0, instrumentName: 'Refrigerated Centrifuge (Eppendorf 5804R)', categoryId: 11, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_259413724_2_2025_100003_Refrigerated_Centirfuge-Instrument.JPG' },
        { id: 23, instrumentId: 0, instrumentName: 'Distilled Water (milli-Q water)', categoryId: 0, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_507378691_3_2025_100015_noImage.jpg' },
    ];
}
