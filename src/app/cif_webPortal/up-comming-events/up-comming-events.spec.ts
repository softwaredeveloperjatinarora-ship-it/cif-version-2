import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpCommingEvents } from './up-comming-events';

describe('UpCommingEvents', () => {
  let component: UpCommingEvents;
  let fixture: ComponentFixture<UpCommingEvents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpCommingEvents]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpCommingEvents);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
