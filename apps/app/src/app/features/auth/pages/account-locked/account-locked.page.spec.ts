import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountLockedPage } from './account-locked.page';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('AccountLockedPage', () => {
  let component: AccountLockedPage;
  let fixture: ComponentFixture<AccountLockedPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AccountLockedPage,
        RouterModule.forRoot([]),
        IonicModule.forRoot(),
        FormsModule,
        ReactiveFormsModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountLockedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the account locked message', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('h2').textContent).toContain('Cuenta Bloqueada');
  });

  it('should display the remaining lock time', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('strong').textContent).toContain('15:00');
  });

  it('should have the form disabled while the account is locked', () => {
    const compiled = fixture.nativeElement;
    const button = compiled.querySelector('button');
    expect(button.disabled).toBe(true);
  });

  it('should have the form enabled when the lock expires', () => {
    component.isFormDisabled = false;
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    const button = compiled.querySelector('button');
    expect(button.disabled).toBe(false);
  });
});
