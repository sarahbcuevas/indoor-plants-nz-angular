import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AdminOverviewComponent } from './admin-overview.component';

describe('AdminOverviewComponent', () => {
  let component: AdminOverviewComponent;
  let fixture: ComponentFixture<AdminOverviewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminOverviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
