import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationPage } from './confirmation.page';
import { RouterTestingModule } from '@angular/router/testing';

describe('ConfirmationPage', () => {
  let component: ConfirmationPage;
  let fixture: ComponentFixture<ConfirmationPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationPage, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
