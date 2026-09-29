import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoleInitialPage } from './role-initial-page.page';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

describe('RoleInitialPage', () => {
  let component: RoleInitialPage;
  let fixture: ComponentFixture<RoleInitialPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleInitialPage, NoopAnimationsModule, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(RoleInitialPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
