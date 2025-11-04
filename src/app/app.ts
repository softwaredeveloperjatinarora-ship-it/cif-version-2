import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent,FooterComponent,CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true,
  
})
export class App {
  protected readonly title = signal('cif-version-2');
}
