import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DuckList } from './duck-list';

describe('DuckList', () => {
  let component: DuckList;
  let fixture: ComponentFixture<DuckList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DuckList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DuckList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
