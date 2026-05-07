import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PlayerBarComponent } from './player-bar/player-bar.component';
import { MiniPlayerComponent } from './mini-player/mini-player.component';

@NgModule({
  declarations: [
    PlayerBarComponent,
    MiniPlayerComponent
  ],
  imports: [
    CommonModule,
    TranslateModule
  ],
  exports: [
    PlayerBarComponent,
    MiniPlayerComponent
  ]
})
export class PlayerModule {}
