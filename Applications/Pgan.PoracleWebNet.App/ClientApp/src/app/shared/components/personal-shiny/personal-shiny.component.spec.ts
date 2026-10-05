import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ConfigService } from '../../../core/services/config.service';
import { PersonalShinyComponent } from './personal-shiny.component';

describe('Personal shiny filter', () => {
  it('rechecks newly granted access and keeps account selection in the form', () => {
    TestBed.configureTestingModule({
      imports: [PersonalShinyComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations(),
        { provide: ConfigService, useValue: { apiHost: '' } }],
    });
    const fixture = TestBed.createComponent(PersonalShinyComponent);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/personal-shiny?refresh=false').flush({ allowed: false, accounts: [] });
    fixture.componentInstance.load(true);
    http.expectOne('/api/personal-shiny?refresh=true').flush({ allowed: true, accounts: [
      { slot: 1, trainerName: 'First' }, { slot: 2, trainerName: 'Second' },
    ] });
    expect(fixture.componentInstance.value()).toBe('all');
    fixture.componentInstance.select(['all', '2']);
    expect(fixture.componentInstance.value()).toBe('2');
    fixture.componentInstance.select(['1', '2']);
    expect(fixture.componentInstance.value()).toBe('1,2');
    fixture.componentInstance.select([]);
    expect(fixture.componentInstance.value()).toBe('');
    http.verify();
  });
});
