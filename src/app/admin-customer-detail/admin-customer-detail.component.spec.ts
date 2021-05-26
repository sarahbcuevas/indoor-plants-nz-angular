import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCustomerDetailComponent } from './admin-customer-detail.component';

describe('AdminCustomerDetailComponent', () => {
  let component: AdminCustomerDetailComponent;
  let fixture: ComponentFixture<AdminCustomerDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminCustomerDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminCustomerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
