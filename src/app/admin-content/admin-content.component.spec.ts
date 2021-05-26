import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AdminContentComponent } from './admin-content.component';

describe('AdminContentComponent', () => {
  let component: AdminContentComponent;
  let fixture: ComponentFixture<AdminContentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
