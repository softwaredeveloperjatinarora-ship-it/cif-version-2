import { Routes } from '@angular/router';
export const routes: Routes = [

  {
    path: 'UserProfiles',
    loadComponent: () => import('./InternalUserDashboard/Profile/Profiles').then(m => m.UserProfileComponent)
  },
  {
    path: 'SampleStatus',
    loadComponent: () => import('./InternalUserDashboard/SampleStatus/SampleStatus').then(m => m.SampleStatusComponent)
  },
  {
    path: 'FeedbackForm',
    loadComponent: () => import('./InternalUserDashboard/UserFeedback/FeedbackForm').then(m => m.UserFeedbackFormComponent)
  },
  {
    path: 'BookingResult',
    loadComponent: () => import('./InternalUserDashboard/BookingResults/BookingResults.component').then(m => m.BookingResultsComponent)
  },
  {
    path: 'BookingStatus',
    loadComponent: () => import('./InternalUserDashboard/BookingStatus/BookingStatus.component').then(m => m.BookingStatusComponent)
  },
  {
    path: 'FailedPayments',
    loadComponent: () => import('./InternalUserDashboard/FailedPayments/FailedPayments.component').then(m => m.FailedPaymentsComponent)
  },
  {
    path: 'SearchPendingPayments',
    loadComponent: () => import('./InternalUserDashboard/search-payments-pending/search-payments-pending.component').then(m => m.SearchPaymentsPendingComponent)
  },
  {
    path: 'SearchPayments',
    loadComponent: () => import('./InternalUserDashboard/Search-Bookings/search-payments.component').then(m => m.SearchPaymentsComponent)
  },
  {
    path: 'ViewBookings',
    loadComponent: () => import('./InternalUserDashboard/ViewBookings/view-bookings.component').then(m => m.ViewBookingsComponent)
  },
  {
    path: 'NewBookings',
    loadComponent: () => import('./InternalUserDashboard/CIF-NewBookings/NewBookings.component').then(m => m.NewBookingsComponent)
  },
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





  {
    path: 'StaffLogins',
    loadComponent: () => import('./cif_webPortal/StaffLogin/StaffLogin').then(m => m.StaffUserLoginComponent)
  },
  {
    path: 'StaffActionBookings',
    loadComponent: () => import('./StaffDashboard/StaffActionBookings/TakeActions').then(m => m.StaffActionBookingsComponent)
  },
  {
    path: 'UserDetailSS',
    loadComponent: () => import('./StaffDashboard/UserDetails/AllUserDetails').then(m => m.StaffUserDetailsComponent)
  },
  {
    path: 'PendingPaymentsS',
    loadComponent: () => import('./StaffDashboard/UserPaymentDetails/PendingPayments').then(m => m.StaffPendingPaymentsComponent)
  },
  {
    path: 'SampleStatusS',
    loadComponent: () => import('./StaffDashboard/SampleStatus/SampleStatusDetails').then(m => m.StaffUpdateSampleStatusComponent)
  },
];