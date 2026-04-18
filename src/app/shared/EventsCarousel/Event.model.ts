// src/app/models/event.model.ts

/**
 * EventModel - Represents an event in the system
 * Refactored for Angular 20 with proper typing
 */
export interface EventModel {
  eventId: number | null; // null for new events, number for existing
  eventName: string;
  eventDate: string; // ISO date format (YYYY-MM-DD or ISO 8601)
  eventCategory: 'Upcoming' | 'Happenings';
  eventDetails: string;
  imageUrl: string;
  // Additional fields for API communication
  action?: 'Insert' | 'Update' | 'Delete' | 'View';
  eventFileData?: any;
  disapprovalReason?: string;
  loginName?: string;
}

/**
 * ApiResponse - Generic API response structure
 * Used for all CRUD operations
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  item1?: T[];
  data?: T;
  errors?: string[];
  returnCode?: number;
}

/**
 * EventFormData - Form data structure for creating/updating events
 * Maps to the EventModel but with optional fields for partial updates
 */
export interface EventFormData extends Partial<EventModel> {
  eventId?: number | null;
  eventName: string;
  eventDate: string;
  eventCategory: 'Upcoming' | 'Happenings';
  eventDetails: string;
  imageUrl?: string;
}

/**
 * PaginatedResponse - Response for paginated data
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
