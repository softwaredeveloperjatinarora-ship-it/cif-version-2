import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID, ChangeDetectorRef, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { isPlatformBrowser, CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './footer.component.html', 
})
export class FooterComponent implements OnInit, AfterViewInit {
  footerHtml: SafeHtml = '';
  showGotoTop = false;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private el: ElementRef, // Added to find scripts in the DOM
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.http
      .get('https://www.lpu.in/includepages/newlpu/footer.php', { responseType: 'text' })
      .subscribe({
        next: html => {

          this.footerHtml = this.sanitizer.bypassSecurityTrustHtml(html);
          

          this.cdr.detectChanges();


          if (isPlatformBrowser(this.platformId)) {
            setTimeout(() => this.executeScripts(), 100); 
          }
        },
        error: err => console.error('Error fetching footer:', err),
      });
  }


  private executeScripts() {
    const scripts = this.el.nativeElement.querySelectorAll('script');
    scripts.forEach((oldScript: HTMLScriptElement) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('scroll', () => {
        const scrolled = window.scrollY > 300;
        if (this.showGotoTop !== scrolled) {
          this.showGotoTop = scrolled;
          this.cdr.detectChanges(); // Update UI for the back-to-top button
        }
      });
    }
  }

  scrollToTop(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }
}















































