import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DuckForm } from './duck-form';

describe('DuckForm', () => {
  let component: DuckForm;
  let fixture: ComponentFixture<DuckForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DuckForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DuckForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
