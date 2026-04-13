
export interface EventModel {

  MouId: string;
  MOUTitle: string;
  MOUDocumentUrl: string;
  MOUDocumentData: string;
  MouStartDate: string;
  MouEndDate: string;
  MOURemarks: string;
  ApprovalRemarks: string;
  UserId: string;


  action?: 'Insert' | 'Update' | 'Delete' | 'ViewAll' | 'Approve' | 'DisApprove';
  disapprovalReason?: string;
  loginName?: string;
}


export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  item1?: T[];
  data?: T;
  errors?: string[];
  returnCode?: number;
}


export interface EventFormData extends Partial<EventModel> {
  UserId: string;
  MOUDocumentUrl: string;
  MouStartDate: string;
  MouEndDate: string;
  MOURemarks: string;

}


export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
