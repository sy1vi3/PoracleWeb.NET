import { HttpClient } from '@angular/common/http';
import { Component, inject, model, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { ConfigService } from '../../../core/services/config.service';

interface ShinyAccess {
  accounts: { slot: number; trainerName: string }[];
  allowed: boolean;
}

@Component({
  imports: [MatButtonModule, MatFormFieldModule, MatSelectModule],
  selector: 'app-personal-shiny',
  standalone: true,
  styles: `
    .shiny-filter {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    mat-form-field {
      width: 100%;
    }
    span {
      font-size: 13px;
    }
  `,
  template: `
    <div class="shiny-filter">
      @if (access()?.allowed && access()!.accounts.length) {
        <mat-form-field appearance="outline">
          <mat-label>Shiny for</mat-label>
          <mat-select
            multiple
            placeholder="Any Pokémon"
            [value]="value() ? value().split(',') : []"
            (selectionChange)="select($event.value)">
            <mat-option value="all">All linked accounts</mat-option>
            @for (account of access()!.accounts; track account.slot) {
              <mat-option [value]="'' + account.slot">{{ account.trainerName || 'Account ' + account.slot }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      } @else {
        <button mat-stroked-button type="button" [disabled]="loading()" (click)="load(true)">
          {{ loading() ? 'Checking…' : 'Personal shiny' }}
        </button>
        @if (value()) {
          <button mat-button type="button" (click)="value.set('')">Remove shiny filter</button>
        }
        @if (message()) {
          <span role="status">{{ message() }}</span>
        }
      }
    </div>
  `,
})
export class PersonalShinyComponent implements OnInit {
  private readonly config = inject(ConfigService);
  private readonly http = inject(HttpClient);
  readonly access = signal<ShinyAccess | null>(null);
  readonly loading = signal(false);
  readonly message = signal('');
  readonly value = model('');

  load(refresh: boolean): void {
    this.loading.set(true);
    this.message.set('');
    this.http.get<ShinyAccess>(`${this.config.apiHost}/api/personal-shiny?refresh=${refresh}`).subscribe({
      error: () => {
        this.loading.set(false);
        this.message.set('Couldn’t load shiny access. Try again.');
      },
      next: result => {
        this.access.set(result);
        this.loading.set(false);
        if (refresh || this.value()) {
          if (!result.allowed) this.message.set('Shiny access required.');
          else if (!result.accounts.length) this.message.set('Link an account in the map first.');
        }
        if (refresh && result.allowed && result.accounts.length && !this.value()) this.value.set('all');
      },
    });
  }

  ngOnInit(): void {
    this.load(false);
  }

  select(values: string[]): void {
    if (values.includes('all')) {
      this.value.set(this.value() === 'all' ? values.filter(v => v !== 'all').join(',') : 'all');
    } else this.value.set(values.join(','));
  }
}
