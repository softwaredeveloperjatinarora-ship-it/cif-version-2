import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAssignTestComponent } from './AdminAssignTest.component';

describe('AdminAssignTestComponent', () => {
  let component: AdminAssignTestComponent;
  let fixture: ComponentFixture<AdminAssignTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminAssignTestComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAssignTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
