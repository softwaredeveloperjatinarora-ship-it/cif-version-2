// import { Injectable } from '@angular/core';
// import { MatDialog,  MatDialogRef } from '@angular/material/dialog';
// import { SucessDialogComponent } from '../dialog/sucess-dialog/sucess-dialog.component';
// import { Router, RouteConfigLoadStart, RouteConfigLoadEnd } from '@angular/router';
// @Injectable({
//   providedIn: 'root'
// })
// export class CohortcommonService {
//   selectedCohorts = [];
//   selected = [];
//   isLoading: boolean;

//   successDialogRef: MatDialogRef<SucessDialogComponent>;

//   constructor(private _dialogBox: MatDialog, private router: Router ) { }

//   getSelectedCohorts(){
   
//     return this.selectedCohorts;
//   }
  
//   setSelectedCohorts(data: any){
//     this.selectedCohorts = data;
//   }
//   getSelected(){
   
//     return this.selected;
//   }
  
//   setSelected(data: any){
//     this.selected = data;
//   }
  
//   successPopup(message: string) {
//         this.successDialogRef = this._dialogBox.open(
//           SucessDialogComponent,
//             {
//                 width: "auto",
//                 height: "auto",
//                 disableClose: true,
//                 minWidth: "320px",
//                 maxWidth: "320px",
//             }
//         );
//         this.successDialogRef.componentInstance.confirmMessage = message;
//         return this.successDialogRef;
//     }
 


//   }


