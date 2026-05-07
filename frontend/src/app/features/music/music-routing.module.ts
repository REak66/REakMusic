import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SongListComponent } from './song-list/song-list.component';
import { SongDetailComponent } from './song-detail/song-detail.component';
import { ArtistDetailComponent } from './artist-detail/artist-detail.component';
import { AlbumDetailComponent } from './album-detail/album-detail.component';
import { GenreDetailComponent } from './genre-detail/genre-detail.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'songs', component: SongListComponent },
  { path: 'songs/:id', component: SongDetailComponent },
  { path: 'artists/:id', component: ArtistDetailComponent },
  { path: 'albums/:id', component: AlbumDetailComponent },
  { path: 'genres/:slug', component: GenreDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MusicRoutingModule {}
