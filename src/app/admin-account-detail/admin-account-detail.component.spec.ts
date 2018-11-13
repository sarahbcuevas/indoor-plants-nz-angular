import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAccountDetailComponent } from './admin-account-detail.component';

describe('AdminAccountDetailComponent', () => {
  let component: AdminAccountDetailComponent;
  let fixture: ComponentFixture<AdminAccountDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminAccountDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminAccountDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
