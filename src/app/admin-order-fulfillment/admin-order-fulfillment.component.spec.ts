import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminOrderFulfillmentComponent } from './admin-order-fulfillment.component';

describe('AdminOrderFulfillmentComponent', () => {
  let component: AdminOrderFulfillmentComponent;
  let fixture: ComponentFixture<AdminOrderFulfillmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminOrderFulfillmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminOrderFulfillmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
