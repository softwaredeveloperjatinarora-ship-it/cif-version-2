import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * CifMouCrudService
 * Handles all API communication for CIF MOU CRUD operations
 *
 * API Endpoint: [Your API Base URL]/api/CIFMOUCrud
 * Expected Actions: 'Insert', 'Update', 'Delete', 'View', 'ViewAll'
 * Stored Procedure: pCIFMouDocumentCrud
 */
@Injectable({
  providedIn: 'root',
})
export class CifMouCrudService {
  private readonly apiUrl =  environment.LocalapiUrl + '/CIFMOUCrudOperation' ;//'https://your-api-url/api/CIFMOUCrud'; // Replace with actual API URL

    private readonly LocalbaseUrl = environment.LocalapiUrl //
  constructor(private http: HttpClient) {}

  /**
   * Execute CIF MOU CRUD Operation
   *
   * @param formData FormData containing:
   *   - Action: 'Insert' | 'Update' | 'Delete' | 'View' | 'ViewAll'
   *   - UserId: string (user email or ID)
   *   - MouStartDate: string (YYYY-MM-DD format)
   *   - MouEndDate: string (YYYY-MM-DD format)
   *   - MOURemarks: string (remarks about MOU)
   *   - MOUDocumentUrl: string (filename)
   *   - MOUDocumentData: string (base64 encoded file)
   *   - LoginName: string (current user/admin email)
   *
   * @param action The action type for logging
   * @returns Observable<ApiResponse>
   *
   * @example
   * const formData = new FormData();
   * formData.append('Action', 'ViewAll');
   * formData.append('LoginName', 'admin@example.com');
   *
   * this.service.executeRequest(formData, 'ViewAll').subscribe(
   *   (response) => console.log('Success', response),
   *   (error) => console.error('Error', error)
   * );
   */
  executeRequest(formData: FormData, action: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData).pipe(
      timeout(30000), // 30 second timeout
      retry(1), // Retry once on failure
      catchError(this.handleError)
    );
  }

  /**
   * Get all MOU records (ViewAll action)
   * Admin endpoint - returns all MOUs
   *
   * @param loginName Current user/admin email
   * @returns Observable<ApiResponse> with item1 array containing all MOUs
   */
  getAllMous(loginName: string): Observable<any> {
    const formData = new FormData();
    formData.append('Action', 'ViewAll');
    formData.append('LoginName', loginName);

    return this.executeRequest(formData, 'ViewAll');
  }

  /**
   * Get user's MOU records (View action)
   * Returns only approved MOUs for the specified user
   *
   * @param userId User email or ID
   * @param loginName Current user email
   * @returns Observable<ApiResponse> with item1 array containing user's MOUs
   */
  getUserMous(userId: string, loginName: string): Observable<any> {
    const formData = new FormData();
    formData.append('Action', 'View');
    formData.append('UserId', userId);
    formData.append('LoginName', loginName);

    return this.executeRequest(formData, 'View');
  }

  /**
   * Create new MOU record (Insert action)
   * Requires: UserId, MouStartDate, MouEndDate, MOURemarks, MOUDocumentUrl, MOUDocumentData
   *
   * @param mouData Object containing MOU details
   * @param loginName User email/login name
   * @returns Observable<ApiResponse>
   */
  createMou(mouData: any, loginName: string): Observable<any> {
    const formData = new FormData();
    formData.append('Action', 'Insert');
    formData.append('UserId', mouData.userId);
    formData.append('MouStartDate', mouData.mouStartDate);
    formData.append('MouEndDate', mouData.mouEndDate);
    formData.append('MOURemarks', mouData.mouRemarks);
    formData.append('MOUDocumentUrl', mouData.mouDocumentUrl || '');
    formData.append('MOUDocumentData', mouData.mouDocumentData || '');
    formData.append('LoginName', loginName);

    return this.executeRequest(formData, 'Insert');
  }

  /**
   * Update existing MOU record (Update action)
   * Updates the MOU document and related information
   *
   * @param userId User ID/email to update
   * @param mouData Object containing updated MOU details
   * @param loginName User email/login name
   * @returns Observable<ApiResponse>
   */
  updateMou(userId: string, mouData: any, loginName: string): Observable<any> {
    const formData = new FormData();
    formData.append('Action', 'Update');
    formData.append('UserId', userId);
    formData.append('MouStartDate', mouData.mouStartDate);
    formData.append('MouEndDate', mouData.mouEndDate);
    formData.append('MOURemarks', mouData.mouRemarks);
    formData.append('MOUDocumentUrl', mouData.mouDocumentUrl || '');
    formData.append('MOUDocumentData', mouData.mouDocumentData || '');
    formData.append('LoginName', loginName);

    return this.executeRequest(formData, 'Update');
  }

  /**
   * Delete/Reject MOU record (Delete action)
   * Marks MOU as not approved (IsMouApproved = 0)
   *
   * @param userId User ID/email to reject
   * @param mouRemarks Reason for rejection
   * @param loginName Admin email/login name
   * @returns Observable<ApiResponse>
   */
  rejectMou(userId: string, mouRemarks: string, loginName: string): Observable<any> {
    const formData = new FormData();
    formData.append('Action', 'Delete');
    formData.append('UserId', userId);
    formData.append('MOURemarks', mouRemarks);
    formData.append('LoginName', loginName);

    return this.executeRequest(formData, 'Delete');
  }

  /**
   * Approve MOU record
   * Updates record with approval status
   *
   * @param userId User ID/email to approve
   * @param mouData MOU details
   * @param loginName Admin email/login name
   * @returns Observable<ApiResponse>
   */
  approveMou(userId: string, mouData: any, loginName: string): Observable<any> {
    const formData = new FormData();
    formData.append('Action', 'Update');
    formData.append('UserId', userId);
    formData.append('MouStartDate', mouData.mouStartDate);
    formData.append('MouEndDate', mouData.mouEndDate);
    formData.append('MOURemarks', mouData.mouRemarks);
    formData.append('MOUDocumentUrl', mouData.mouDocumentUrl || '');
    formData.append('LoginName', loginName);

    return this.executeRequest(formData, 'Update');
  }

  /**
   * Handle HTTP errors
   * @private
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error('API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

/**
 * API Response Structure
 * Expected format from API endpoint
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  item1?: T[]; // Array of items (used for ViewAll, View)
  data?: T; // Single item data
  errors?: string[];
  returnCode?: number;
  returnId?: number; // For Insert/Update/Delete operations
}

/**
 * CIF MOU Model
 * Represents structure of CIF MOU entity
 */
export interface CifMouModel {
  userId: string; // User email or ID
  emailId?: string; // Email address
  mouStartDate: string; // ISO format: YYYY-MM-DD
  mouEndDate: string; // ISO format: YYYY-MM-DD
  mouDocumentUrl: string; // Filename
  mouRemarks: string; // Comments/remarks
  mouDocumentData?: string; // Base64 encoded file
  action?: 'Insert' | 'Update' | 'Delete' | 'View' | 'ViewAll';
  loginName?: string; // Admin/user email
  isMouApproved?: number; // 0 = rejected, 1 = approved, null = pending
  mouStatus?: string; // '0' = active, '1' = expired
  mouApprovedBy?: string; // Approver email
  mouApprovedOn?: string; // Approval date
}

/**
 * MOU Status Enum
 */
export enum MouStatusEnum {
  Active = '0',
  Expired = '1',
}

/**
 * MOU Approval Status Enum
 */
export enum MouApprovalStatus {
  // Pending = null,
  Approved = 1,
  Rejected = 0,
}
