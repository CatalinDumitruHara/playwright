import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { UnauthorizedAccessComponent } from './unauthorized-access.page';

describe('UnauthorizedAccessComponent', () => {
  let component: UnauthorizedAccessComponent;
  let fixture: ComponentFixture<UnauthorizedAccessComponent>;
  let router: Router;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, UnauthorizedAccessComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UnauthorizedAccessComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to the correct route when the back button is clicked', () => {
    const spy = jest.spyOn(router, 'navigate');
    const backButton = fixture.nativeElement.querySelector('b2b-button');
    backButton.click();
    expect(spy).toHaveBeenCalledWith(['/']);
  });
});
