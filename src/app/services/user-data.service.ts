import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserDataService {
  userData = signal({
    UserRole: '',
    user_Email: '',
    supervisorName: '',
    departmentName: '',
    candidateName: ''
  });

  setUserRole(role: string): void {
    this.userData.update(prev => ({ ...prev, UserRole: role }));
  }

  setUserEmail(email: string): void {
    this.userData.update(prev => ({ ...prev, user_Email: email }));
  }

  setSupervisorName(name: string): void {
    this.userData.update(prev => ({ ...prev, supervisorName: name }));
  }

  setDepartmentName(name: string): void {
    this.userData.update(prev => ({ ...prev, departmentName: name }));
  }

  setCandidateName(name: string): void {
    this.userData.update(prev => ({ ...prev, candidateName: name }));
  }

  setUserData(data: any): void {
    this.userData.set({
      UserRole: data.userRole || '',
      user_Email: data.EmailId || '',
      supervisorName: data.SupervisorName || '',
      departmentName: data.DepartmentName || '',
      candidateName: data.CandidateName || ''
    });
  }

  clearUserData(): void {
    this.userData.set({
      UserRole: '',
      user_Email: '',
      supervisorName: '',
      departmentName: '',
      candidateName: ''
    });
  }
}