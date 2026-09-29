import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpiredCredentialPage } from './expired-credential.page';
import {
  B2bButtonComponent,
  B2bNotificationInlineComponent,
} from '@mapfre-tech/b2b-components';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

describe('ExpiredCredentialPage', () => {
  let component: ExpiredCredentialPage;
  let fixture: ComponentFixture<ExpiredCredentialPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ExpiredCredentialPage,
        B2bButtonComponent,
        B2bNotificationInlineComponent,
        NoopAnimationsModule,
        RouterTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpiredCredentialPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
