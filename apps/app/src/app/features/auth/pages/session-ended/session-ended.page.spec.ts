import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionEndedPage } from './session-ended.page';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

describe('SessionEndedPage', () => {
  let component: SessionEndedPage;
  let fixture: ComponentFixture<SessionEndedPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionEndedPage, NoopAnimationsModule, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionEndedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
