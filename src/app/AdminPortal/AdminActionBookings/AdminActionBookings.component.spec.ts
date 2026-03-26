import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminActionBookingsComponent } from './AdminActionBookings.component';

describe('AdminActionBookingsComponent', () => {
  let component: AdminActionBookingsComponent;
  let fixture: ComponentFixture<AdminActionBookingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminActionBookingsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminActionBookingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
