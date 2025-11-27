import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CifMenuBarComponent } from './cif-menu-bar.component';

describe('CifMenuBarComponent', () => {
  let component: CifMenuBarComponent;
  let fixture: ComponentFixture<CifMenuBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CifMenuBarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CifMenuBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
