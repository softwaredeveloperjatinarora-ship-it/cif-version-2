import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

import { StorageService } from './storage.service';

// ─── Interfaces matching the stored procedure columns ────────────────────────

export interface MouInsertPayload {
  action: 'Insert';
  mouTitle: string;
  mouDocumentUrl?: string;
  mouDocumentData?: string;
  mouStartDate: string;
  mouEndDate: string;
  mouRemarks?: string;
  userId: string;
}
export interface MouUpdatePayload {
  action: 'Update';
  mouId: string;
  mouTitle?: string;
  mouDocumentData: string;   // required on update — user must re-upload document
  mouDocumentUrl: string;    // required on update — filename of the new document
  mouStartDate?: string;
  mouEndDate: string;
  mouRemarks?: string;
  loginName: string;
    userId: string;
}

export interface MouDeletePayload {
  action: 'Delete';
  mouId: string;
  mouTitle: string;
  userId: string;
  loginName: string;
}

export interface MouApprovePayload {
  action: 'Approve' | 'DisApprove';
  mouId: string;
  userId: string;
  approvalRemarks?: string;
  loginName: string;
}

export interface MouRecord {
  mouTitle: string;
  mouStartDate: string;
  mouEndDate: string;
  mouStatus: any;
  mouRemarks: string;
  isApproved: any;
  isActive: any;
  userEmailId: string;
  createdOn: string;
  userName: string;
  userRole: any;
  userType: string;
  mouDocumentUrl?: string;
  mouId?: string;
  approvalRemarks?: string;
}

export interface MouApiResponse {
  item1: { msg: string; returnId: string | number }[];
}

export interface MouViewResponse {
  item1: MouRecord[];
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class MOUCrudOperation {
  private readonly authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJMb2dpbk5hbWUiOiJDSUYiLCJuYmYiOjE3NTM3NzU3ODIsImV4cCI6MTc4NTMxMTc4MiwiaWF0IjoxNzUzNzc1NzgyLCJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo3MTI1LyIsImF1ZCI6Imh0dHBzOi8vbG9jYWxob3N0OjcxMjUvIn0.9Oc0vzoLFrYmMpzfN5z9cDy-ysE3PgyxY8o4XC8ZRuI';
  private readonly http           = inject(HttpClient);
  private readonly storageService = inject(StorageService);

  // ✅ Update to your actual API base URL
  private readonly baseUrl = 'https://localhost:7125/api/LpuCIF';

  // ── Bearer-only header for FormData (browser sets Content-Type + boundary) ─
  private get authHeadersFormData(): HttpHeaders {
    const token = this.storageService.getUser();
    return new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken);
  }

  // ── Shared error handler ──────────────────────────────────────────────────
  private handleError<T>(operation: string, fallback: T) {
    return (error: any): Observable<T> => {
      console.error(`[CIFMOUCrudOperation] ${operation} failed:`, error);
      return of(fallback);
    };
  }

  // ── Helper: build FormData with SP-matching PascalCase keys ──────────────
  // ROOT CAUSE FIX: The SP parameters are @Action, @UserId, @MouId etc.
  // (PascalCase). Sending a JSON body with camelCase keys means the backend
  // model-binder cannot map them → all SP params arrive as NULL → empty result.
  //
  // SOLUTION: Use FormData (same pattern as EventsCrudOperation) so each key
  // is appended explicitly with the exact casing the SP/controller expects.
  private buildFormData(fields: Record<string, string | undefined | null>): FormData {
    const fd = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      // Only append defined, non-null values — avoids sending the string "null"
      if (value !== undefined && value !== null && value !== '') {
        fd.append(key, value);
      }
    }
    return fd;
  }

  // ── Insert new MOU (Simple User) ──────────────────────────────────────────
  insertMou(payload: MouInsertPayload): Observable<MouApiResponse> {
    const fd = this.buildFormData({
      Action:          'Insert',
      MOUTitle:        payload.mouTitle,
      MOUDocumentUrl:  payload.mouDocumentUrl,
      MOUDocumentData: payload.mouDocumentData,
      MouStartDate:    payload.mouStartDate,
      MouEndDate:      payload.mouEndDate,
      MOURemarks:      payload.mouRemarks,
      UserId:          payload.userId,
    });

    return this.http.post<MouApiResponse>(
      `${this.baseUrl}/CIFMOUCrudOperation`,
      fd,
      { headers: this.authHeadersFormData }
    ).pipe(
      catchError(this.handleError('insertMou',
        { item1: [{ msg: 'Failed', returnId: -1 }] }))
    );
  }

  // ── Update existing MOU (Simple User) ────────────────────────────────────
  updateMou(payload: MouUpdatePayload): Observable<MouApiResponse> {
    const fd = this.buildFormData({
      Action:         'Update',
      MouId:          payload.mouId,
      MOUTitle:       payload.mouTitle,
      MOUDocumentUrl: payload.mouDocumentUrl,
      MouStartDate:   payload.mouStartDate,
      MouEndDate:     payload.mouEndDate,
      MOURemarks:     payload.mouRemarks,
      LoginName:      payload.loginName,
    });

    return this.http.post<MouApiResponse>(
      `${this.baseUrl}/CIFMOUCrudOperation`,
      fd,
      { headers: this.authHeadersFormData }
    ).pipe(
      catchError(this.handleError('updateMou',
        { item1: [{ msg: 'Failed', returnId: -1 }] }))
    );
  }


  // ── Delete / deactivate MOU (Admin) ──────────────────────────────────────
  deleteMou(payload: MouDeletePayload): Observable<MouApiResponse> {
    const fd = this.buildFormData({
      Action:    'Delete',
      MouId:     payload.mouId,
      MOUTitle:  payload.mouTitle,
      UserId:    payload.userId,
      LoginName: payload.loginName,
    });

    return this.http.post<MouApiResponse>(
      `${this.baseUrl}/CIFMOUCrudOperation`,
      fd,
      { headers: this.authHeadersFormData }
    ).pipe(
      catchError(this.handleError('deleteMou',
        { item1: [{ msg: 'Failed', returnId: -1 }] }))
    );
  }

  // ── View MOUs for a specific user (Simple User) ───────────────────────────
  viewMyMous(userId: string): Observable<MouViewResponse> {
    const fd = this.buildFormData({
      Action: 'View',
      UserId: userId,
    });

    return this.http.post<MouViewResponse>(
      `${this.baseUrl}/CIFMOUCrudOperation`,
      fd,
      { headers: this.authHeadersFormData }
    ).pipe(
      catchError(this.handleError('viewMyMous', { item1: [] }))
    );
  }

  // ── View ALL MOUs (Admin) ─────────────────────────────────────────────────
  // FIX: Was sending { action: 'ViewAll' } as a JSON body — the backend
  // model-binder couldn't map the camelCase 'action' key to the SP's @Action
  // parameter, so @Action arrived NULL → SP fell into the ELSE branch → empty.
  // Now uses FormData with the exact key 'Action' the controller expects.
  viewAllMous(): Observable<MouViewResponse> {
    const fd = this.buildFormData({
      Action: 'ViewAll',
    });

    return this.http.post<MouViewResponse>(
      `${this.baseUrl}/CIFMOUCrudOperation`,
      fd,
      { headers: this.authHeadersFormData }
    ).pipe(
      catchError(this.handleError('viewAllMous', { item1: [] }))
    );
  }

  // ── Approve MOU (Admin) ───────────────────────────────────────────────────
  approveMou(payload: MouApprovePayload): Observable<MouApiResponse> {
    const fd = this.buildFormData({
      Action:          'Approve',
      MouId:           payload.mouId,
      UserId:          payload.userId,
      ApprovalRemarks: payload.approvalRemarks,
      LoginName:       payload.loginName,
    });

    return this.http.post<MouApiResponse>(
      `${this.baseUrl}/CIFMOUCrudOperation`,
      fd,
      { headers: this.authHeadersFormData }
    ).pipe(
      catchError(this.handleError('approveMou',
        { item1: [{ msg: 'Failed', returnId: -1 }] }))
    );
  }

  // ── Disapprove MOU (Admin) ────────────────────────────────────────────────
  disapproveMou(payload: MouApprovePayload): Observable<MouApiResponse> {
    const fd = this.buildFormData({
      Action:          'DisApprove',
      MouId:           payload.mouId,
      UserId:          payload.userId,
      ApprovalRemarks: payload.approvalRemarks,
      LoginName:       payload.loginName,
    });

    return this.http.post<MouApiResponse>(
      `${this.baseUrl}/CIFMOUCrudOperation`,
      fd,
      { headers: this.authHeadersFormData }
    ).pipe(
      catchError(this.handleError('disapproveMou',
        { item1: [{ msg: 'Failed', returnId: -1 }] }))
    );
  }

  // ── Upload MOU document — multipart FormData ──────────────────────────────
  uploadMouDocument(file: File): Observable<{ fileUrl: string }> {
    const fd = new FormData();
    fd.append('File', file);   // PascalCase 'File' to match controller param
    return this.http.post<{ fileUrl: string }>(
      `${this.baseUrl}/CIFMOUCrudOperation`,
      fd,
      { headers: this.authHeadersFormData }
    ).pipe(
      catchError(this.handleError('uploadMouDocument', { fileUrl: '' }))
    );
  }
}
// import { Injectable, inject } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Observable, catchError, of } from 'rxjs';

// import { StorageService } from './storage.service';

// // ─── Interfaces matching the stored procedure columns ────────────────────────

// export interface MouInsertPayload {
//   action: 'Insert';
//   mouTitle: string;
//   mouDocumentUrl?: string;
//   mouDocumentData?: string;   // base64
//   mouStartDate: string;       // yyyy-MM-dd
//   mouEndDate: string;         // yyyy-MM-dd
//   mouRemarks?: string;
//   userId: string;             // user email
// }

// export interface MouUpdatePayload {
//   action: 'Update';
//   mouId: string;
//   mouTitle?: string;
//   mouDocumentUrl?: string;
//   mouStartDate?: string;
//   mouEndDate: string;         // required by SP
//   mouRemarks?: string;
//   loginName: string;
// }

// export interface MouDeletePayload {
//   action: 'Delete';
//   mouId: string;
//   mouTitle: string;
//   userId: string;
//   loginName: string;
// }

// export interface MouApprovePayload {
//   action: 'Approve' | 'DisApprove';
//   mouId: string;
//   userId: string;
//   approvalRemarks?: string;
//   loginName: string;
// }

// export interface MouViewPayload {
//   action: 'View';
//   userId: string;
// }

// export interface MouViewAllPayload {
//   action: 'ViewAll';
// }

// export interface MouRecord {
//   mouTitle: string;
//   mouStartDate: string;
//   mouEndDate: string;
//   mouStatus: string;          // '0' = active, '1' = expired
//   mouRemarks: string;
//   isApproved: number;         // 0 | 1
//   isActive: number;
//   userEmailId: string;
//   createdOn: string;
//   userName: string;
//   userRole: number;
//   userType: string;
//   mouDocumentUrl?: string;
//   mouId?: string;
// }

// export interface MouApiResponse {
//   item1: { msg: string; returnId: string | number }[];
// }

// export interface MouViewResponse {
//   item1: MouRecord[];
// }

// // ─────────────────────────────────────────────────────────────────────────────

// @Injectable({ providedIn: 'root' })
// export class MOUCrudOperation {

//   private readonly http           = inject(HttpClient);
//   private readonly storageService = inject(StorageService);

//   // ✅ Update this base URL to match your backend API
//   private readonly baseUrl = 'https://localhost:7125/api/LpuCIF';

//   // ── Bearer token header (JSON) — used for all JSON payloads ───────────────
//   // Mirrors the pattern from EventsCrudOperation:
//   //   var authToken = this.storageService.getUser();
//   //   let headers = new HttpHeaders().set('Authorization', 'Bearer ' + authToken)
//   private get authHeaders(): HttpHeaders {
//     const authToken = this.storageService.getUser();
//     return new HttpHeaders()
//       .set('Content-Type', 'application/json')
//       .set('Authorization', 'Bearer ' + authToken);
//   }

//   // ── Bearer token header (multipart) — used for file/FormData uploads ──────
//   // Content-Type is intentionally omitted: the browser sets it automatically
//   // with the correct multipart boundary when sending FormData.
//   private get authHeadersMultipart(): HttpHeaders {
//     const authToken = this.storageService.getUser();
//     return new HttpHeaders()
//       .set('Authorization', 'Bearer ' + authToken);
//   }

//   // ── Shared error handler (mirrors EventsCrudOperation pattern) ─────────────
//   private handleError<T>(operation: string, fallback: T) {
//     return (error: any): Observable<T> => {
//       console.error(`[CIFMOUCrudOperation] ${operation} failed:`, error);
//       return of(fallback);
//     };
//   }

//   // ── Insert new MOU (Simple User) ──────────────────────────────────────────
//   insertMou(payload: MouInsertPayload): Observable<MouApiResponse> {
//     return this.http.post<MouApiResponse>(
//       `${this.baseUrl}/CIFMOUCrudOperation`,
//       payload,
//       { headers: this.authHeaders }
//     ).pipe(
//       catchError(this.handleError('insertMou',
//         { item1: [{ msg: 'Failed', returnId: -1 }] }))
//     );
//   }

//   // ── Update existing MOU (Simple User) ────────────────────────────────────
//   updateMou(payload: MouUpdatePayload): Observable<MouApiResponse> {
//     return this.http.post<MouApiResponse>(
//       `${this.baseUrl}/CIFMOUCrudOperation`,
//       payload,
//       { headers: this.authHeaders }
//     ).pipe(
//       catchError(this.handleError('updateMou',
//         { item1: [{ msg: 'Failed', returnId: -1 }] }))
//     );
//   }

//   // ── Delete / deactivate MOU (Admin) ──────────────────────────────────────
//   deleteMou(payload: MouDeletePayload): Observable<MouApiResponse> {
//     return this.http.post<MouApiResponse>(
//       `${this.baseUrl}/CIFMOUCrudOperation`,
//       payload,
//       { headers: this.authHeaders }
//     ).pipe(
//       catchError(this.handleError('deleteMou',
//         { item1: [{ msg: 'Failed', returnId: -1 }] }))
//     );
//   }

//   // ── View MOUs for a specific user (Simple User) ───────────────────────────
//   viewMyMous(userId: string): Observable<MouViewResponse> {
//     return this.http.post<MouViewResponse>(
//       `${this.baseUrl}/CIFMOUCrudOperation`,
//       { action: 'View', userId } as MouViewPayload,
//       { headers: this.authHeaders }
//     ).pipe(
//       catchError(this.handleError('viewMyMous', { item1: [] }))
//     );
//   }

//   // ── View ALL MOUs (Admin) ─────────────────────────────────────────────────
//   viewAllMous(): Observable<MouViewResponse> {
//     return this.http.post<MouViewResponse>(
//       `${this.baseUrl}/CIFMOUCrudOperation`,
//       { action: 'ViewAll' } as MouViewAllPayload,
//       { headers: this.authHeaders }
//     ).pipe(
//       catchError(this.handleError('viewAllMous', { item1: [] }))
//     );
//   }

//   // ── Approve MOU (Admin) ───────────────────────────────────────────────────
//   approveMou(payload: MouApprovePayload): Observable<MouApiResponse> {
//     return this.http.post<MouApiResponse>(
//       `${this.baseUrl}/CIFMOUCrudOperation`,
//       { ...payload, action: 'Approve' },
//       { headers: this.authHeaders }
//     ).pipe(
//       catchError(this.handleError('approveMou',
//         { item1: [{ msg: 'Failed', returnId: -1 }] }))
//     );
//   }

//   // ── Disapprove MOU (Admin) ────────────────────────────────────────────────
//   disapproveMou(payload: MouApprovePayload): Observable<MouApiResponse> {
//     return this.http.post<MouApiResponse>(
//       `${this.baseUrl}/CIFMOUCrudOperation`,
//       { ...payload, action: 'DisApprove' },
//       { headers: this.authHeaders }
//     ).pipe(
//       catchError(this.handleError('disapproveMou',
//         { item1: [{ msg: 'Failed', returnId: -1 }] }))
//     );
//   }

//   // ── Upload MOU document — multipart FormData ───────────────────────────────
//   // Content-Type header is intentionally NOT set here — the browser sets it
//   // automatically with the multipart boundary when sending FormData.
//   uploadMouDocument(file: File): Observable<{ fileUrl: string }> {
//     const fd = new FormData();
//     fd.append('file', file);
//     return this.http.post<{ fileUrl: string }>(
//       `${this.baseUrl}/UploadDocument`,
//       fd,
//       { headers: this.authHeadersMultipart }   // Bearer only, no Content-Type
//     ).pipe(
//       catchError(this.handleError('uploadMouDocument', { fileUrl: '' }))
//     );
//   }
// }
