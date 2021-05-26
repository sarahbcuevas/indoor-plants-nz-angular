import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminOrderCreateComponent } from './admin-order-create.component';

describe('AdminOrderCreateComponent', () => {
  let component: AdminOrderCreateComponent;
  let fixture: ComponentFixture<AdminOrderCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminOrderCreateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminOrderCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
