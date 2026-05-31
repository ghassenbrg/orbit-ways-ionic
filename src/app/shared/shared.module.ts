import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PieceComponent } from './components/piece.component';
import { StarfieldComponent } from './components/starfield.component';
import { ParticleBurstComponent } from './components/particle-burst.component';
import { CandyButtonComponent } from './components/candy-button.component';
import { ScoreStarsComponent } from './components/score-stars.component';
import { StepperComponent } from './components/stepper.component';
import { SegmentedComponent } from './components/segmented.component';
import { ToggleComponent } from './components/toggle.component';
import { CharOrreryComponent } from './components/char-orrery.component';
import { BoardComponent } from './components/board.component';

const COMPONENTS = [
  PieceComponent,
  StarfieldComponent,
  ParticleBurstComponent,
  CandyButtonComponent,
  ScoreStarsComponent,
  StepperComponent,
  SegmentedComponent,
  ToggleComponent,
  CharOrreryComponent,
  BoardComponent,
];

@NgModule({
  declarations: COMPONENTS,
  imports: [CommonModule],
  exports: COMPONENTS,
})
export class SharedModule {}
