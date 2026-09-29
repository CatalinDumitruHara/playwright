import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AccountLockedPage } from './account-locked.page';

describe('AccountLockedPage', () => {
  let component: AccountLockedPage;
  let fixture: ComponentFixture<AccountLockedPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, AccountLockedPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountLockedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
