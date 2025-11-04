import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { isPlatformBrowser, CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule], 
  templateUrl:'./footer.component.html', 
})
export class FooterComponent implements OnInit, AfterViewInit {
  footerHtml: SafeHtml = '';
  showGotoTop = false;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.http
      .get('https://includepages.lpu.in/newlpu/footer.php', { responseType: 'text' })
      // .get('https://www.lpu.in/includepages/newlpu/footer.php', { responseType: 'text' })
      .subscribe({
        next: html => {
          this.footerHtml = this.sanitizer.bypassSecurityTrustHtml(html);
        },
        error: err => console.error('Error fetching footer:', err),
      });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('scroll', () => {
        this.showGotoTop = window.scrollY > 300;
      });
    }
  }

  scrollToTop(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }
}
