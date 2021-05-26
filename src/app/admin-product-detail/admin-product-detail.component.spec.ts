import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AdminProductDetailComponent } from './admin-product-detail.component';

describe('AdminProductDetailComponent', () => {
  let component: AdminProductDetailComponent;
  let fixture: ComponentFixture<AdminProductDetailComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminProductDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminProductDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
