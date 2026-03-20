import { Routes } from '@angular/router'; 
export const routes: Routes = [ 

{
  path: 'Register',
  loadComponent: () => import('./cif_webPortal/RegisterPage/CifRegisterPage.component').then(m => m.CifRegisterPageComponent)
},
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
 
];