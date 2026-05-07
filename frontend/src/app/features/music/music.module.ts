import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MusicRoutingModule } from './music-routing.module';
import { HomeComponent } from './home/home.component';
import { SongListComponent } from './song-list/song-list.component';
import { SongDetailComponent } from './song-detail/song-detail.component';
import { ArtistDetailComponent } from './artist-detail/artist-detail.component';
import { AlbumDetailComponent } from './album-detail/album-detail.component';
import { GenreDetailComponent } from './genre-detail/genre-detail.component';

@NgModule({
  declarations: [
    HomeComponent,
    SongListComponent,
    SongDetailComponent,
    ArtistDetailComponent,
    AlbumDetailComponent,
    GenreDetailComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule,
    MusicRoutingModule
  ]
})
export class MusicModule {}
