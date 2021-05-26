import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AdminRegisterComponent } from './admin-register.component';

describe('AdminRegisterComponent', () => {
  let component: AdminRegisterComponent;
  let fixture: ComponentFixture<AdminRegisterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminRegisterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
