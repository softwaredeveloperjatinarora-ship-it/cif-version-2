import { Routes } from '@angular/router';

// export const routes: Routes = [];
export const routes: Routes = [


//   {
//   path: 'ourInstruments',
//   loadChildren: () => import('./views/pages/cif_webPortal/CifInstruments/CifInstruments.module').then(m => m.CifInstrumentsModule),
// },
// {
//   path: 'ourInstruments/:Name/:id/:categoryId',    
//   loadChildren: () => import('./views/pages/cif_webPortal/CifInstruments/CifInstruments.module').then(m => m.CifInstrumentsModule),
// },

{
  path: 'Login',
  loadComponent: () => import('./cif_webPortal/LoginPage/CifLoginPage.component').then(m => m.CifLoginPageComponent)
},
  {
    path: 'ourInstruments/:Name/:id/:categoryId',
    loadComponent: () =>
      import('./cif_webPortal/CifInstruments/CifInstruments.component').then((m) => m.CifInstrumentsComponent),
  },
  {
    path: 'ourInstruments/:Name/:id/:categoryId',
    loadComponent: () =>
      import('./cif_webPortal/CifInstruments/CifInstruments.component').then((m) => m.CifInstrumentsComponent),
  },
  {
    path: 'ourInstruments',
    loadComponent: () =>
      import('./cif_webPortal/CifInstruments/CifInstruments.component').then((m) => m.CifInstrumentsComponent),
  },
  {
    path: 'Home',
    loadComponent: () =>
      import('./cif_webPortal/home-page/home-page').then((m) => m.HomePage),
  },
  {
    path: 'LPUTermsCondition',
    loadComponent: () =>
      import('./cif_webPortal/OurTermsConditions/OurTermsConditions.component').then((m) => m.OurTermsConditionsComponent),
  },
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