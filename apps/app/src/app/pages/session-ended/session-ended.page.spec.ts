import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SessionEndedPage } from './session-ended.page';

describe('SessionEndedPage', () => {
  let component: SessionEndedPage;
  let fixture: ComponentFixture<SessionEndedPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, SessionEndedPage],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionEndedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
