import { Routes } from '@angular/router';
export const routes: Routes = [

  {
    path: 'UserMous',
    loadComponent: () => import('./InternalUserDashboard/cif-mou-user-page/new-Mou').then(m => m.NewUserMouComponent)
  },
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
    path: 'recoverAccount',
    loadComponent: () => import('./cif_webPortal/RecoverAccount/RecoverAccount').then(m => m.RecoverAccountComponent)
  },
  {
    path: 'Register',
    loadComponent: () => import('./cif_webPortal/RegisterPage/CifRegisterPage.component').then(m => m.CifRegisterPageComponent)
  },
  {
    path: 'LpuLogin',
    loadComponent: () => import('./cif_webPortal/CifLoginPage/LoginPage').then(m => m.LoginPageComponent)
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
  {
    path: 'MyUploads',
    loadComponent: () => import('./StaffDashboard/MyUploadedResults/StaffUploadedResults').then(m => m.MyUploadedResultsComponent)
  },


  // Admin portal
  {
    path: 'adminLoginX',
    loadComponent: () => import('./AdminPortal/StaffLogin/StaffLogin').then(m => m.AdminLoginComponent)
  },
// A1
    {
    path: 'AssignTestCifA',
    loadComponent: () => import('./AdminPortal/A1/AdminAssignTest.component').then(m => m.AdminAssignTestComponent)
  },
  // A2
  {
    path: 'ViewBookingsAdmins',
    loadComponent: () => import('./AdminPortal/A2/ViewBookingsAdmin').then(m => m.AdminActionBookingsComponent)
  },
  // A3
  {
    path: 'PendingPaymentsA',
    loadComponent: () => import('./AdminPortal/A3/AdminPendingPayments.component').then(m => m.AdminPendingPaymentsComponent)
  },
  //A4
  {
    path: 'AUploadProof',
    loadComponent: () => import('./AdminPortal/A4/AUploadProofStatus.component').then(m => m.AUploadProofStatusComponent)
  },
  //A5
  {
    path: 'AdminInstrumentPrice',
    loadComponent: () => import('./AdminPortal/A5/UpdateInstrumentPrice').then(m => m.AdminUpdateInstrumentPrice)
  },
  {
    path: 'UserDetail',
    loadComponent: () => import('./AdminPortal/A7/AllUserDetails').then(m => m.AdminUserDetailsComponent)
  },
  {
    path: 'AdminUploadImage',
    loadComponent: () => import('./AdminPortal/A8/UpdateInstrumentImage').then(m => m.UpdateInstrumentPriceComponent)
  },
  {
    path: 'SampleStatusAdmin',
    loadComponent: () => import('./AdminPortal/A9/UpdateSampleStatus').then(m => m.AdminUpdateSampleStatusComponent)
  },
  {
    path: 'UserFeedbackdetails',
    loadComponent: () => import('./AdminPortal/A10/UserFeedbacks').then(m => m.StaffUserFeedbackDetailsComponent)
  },
  {
    path: 'AllCIFEvents',
    loadComponent: () => import('./AdminPortal/A11/AllEventsDetails').then(m => m.AdminActionCifEvents)
  },
  {
    path: 'EventUploads',
    loadComponent: () => import('./AdminPortal/A12/EventUploads').then(m => m.AdminNewEventsDataComponent)
  },
  {
    path: 'AdminInstrumentAction',
    loadComponent: () => import('./AdminPortal/A6/AdminActionInstrument').then(m => m.AdminActionInstrumentsComponent)
  },
  {
    path: 'EventCrud',
    loadComponent: () => import('./AdminPortal/A_EventsCrud/new-events-crud.component').then(m => m.NewEventsCrudComponent)
  },
  {
    path: 'CifMouCrud',
    // loadComponent: () => import('./AdminPortal/A_CIFMouCrud/cifMou-crud').then(m => m.cifMouCrudComponent)
    loadComponent: () => import('./AdminPortal/CifMouCrud/admin-mou.component').then(m => m.AdminMouComponent)
  },
];

