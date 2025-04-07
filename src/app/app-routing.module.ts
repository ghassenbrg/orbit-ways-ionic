import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'room',
    pathMatch: 'full',
  },
  {
    path: 'room',
    loadChildren: () =>
      import('./pages/room/room.module').then((m) => m.RoomPageModule),
  },
  {
    path: 'game',
    loadChildren: () =>
      import('./pages/game/game.module').then((m) => m.GamePageModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
