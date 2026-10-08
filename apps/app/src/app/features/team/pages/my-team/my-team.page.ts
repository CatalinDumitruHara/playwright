// Pantalla manager · Mi equipo · EP-011
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TeamMember } from '@api-types';
import { TeamApiService } from '../../../../core/api/team-api.service';

@Component({
  selector: 'app-my-team',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-team.page.html',
  styleUrl: './my-team.page.scss',
})
export class MyTeamPage implements OnInit {
  private teamApi = inject(TeamApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly members = signal<TeamMember[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.teamApi.getMyTeam().subscribe({
      next: (list) => {
        this.members.set(list.items ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No ha sido posible cargar tu equipo, inténtalo de nuevo');
        this.loading.set(false);
      },
    });
  }
}
