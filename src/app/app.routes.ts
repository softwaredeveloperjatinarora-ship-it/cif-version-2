import { Routes } from '@angular/router';

// export const routes: Routes = [];
export const routes: Routes = [
  {
    path: 'Home',
    loadComponent: () =>
      import('./cif_webPortal/home-page/home-page').then((m) => m.HomePage),
  },
  // Default routes
  {
    path: '',
    redirectTo: 'Home',
    pathMatch: 'full',
  },
//   {
//     path: '**',
//     redirectTo: 'Home',
//   },
];