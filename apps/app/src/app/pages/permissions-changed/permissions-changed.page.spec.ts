import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PermissionsChangedPage } from './permissions-changed.page';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('PermissionsChangedPage', () => {
  let component: PermissionsChangedPage;
  let fixture: ComponentFixture<PermissionsChangedPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionsChangedPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PermissionsChangedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call reload method on button click', () => {
    jest.spyOn(component, 'reload');
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    expect(component.reload).toHaveBeenCalled();
  });

  it('should reload the page on reload() call', () => {
    const reloadSpy = jest.fn();
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        reload: reloadSpy,
      },
      writable: true,
    });
    component.reload();
    expect(reloadSpy).toHaveBeenCalled();
  });
});
