import { Component, OnInit, AfterViewInit, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: []
})
export class HeaderComponent implements OnInit, AfterViewInit {
  headerHtml: SafeHtml = '';

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    // Load remote header HTML
    this.http
      .get('https://includepages.lpu.in/newlpu/header.php', { responseType: 'text' })
      .subscribe({
        next: html => {
          this.headerHtml = this.sanitizer.bypassSecurityTrustHtml(html);
        },
        error: err => {
          console.error('Error fetching PHP header:', err);
        }
      });
  }
  

  ngAfterViewInit() {
    this.loadGTMScript('GTM-P8ZP9K2');
  }

  loadGTMScript(gtmId: string) {
    const script = this.document.createElement('script');
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    this.document.head.appendChild(script);
  }
}
