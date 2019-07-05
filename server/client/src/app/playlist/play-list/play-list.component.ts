import { PlaylistService } from './../../services/playlist.service';
import { SpotifyDataService } from './../../services/spotify-data.service';
import { PlaylistDataSource } from './../../services/playlist-data-source';
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatPaginator, MatSort } from '@angular/material';
import { tap } from 'rxjs/operators';
import { merge } from 'rxjs';

@Component({
  selector: 'app-play-list',
  templateUrl: './play-list.component.html',
  styleUrls: ['./play-list.component.scss']
})
export class PlayListComponent implements OnInit, AfterViewInit {

  totalTracks = 9;//TODO get from parent component var tacks

  readonly id: string;
  private dataSource: PlaylistDataSource;
  displayedColumns = ['trackNum', 'trackName', 'pName', 'duration', 'artist', 'delete'];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private route: ActivatedRoute, private spotifyData: SpotifyDataService, private playlistService: PlaylistService) {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  ngOnInit() {
    this.dataSource = new PlaylistDataSource(this.playlistService);
    this.dataSource.loadPlaylist(this.id,'', 'asc', 0, 3);
  }

  ngAfterViewInit() {
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        tap(() => this.loadPlaylistPage())
      ).subscribe();
  }

  loadPlaylistPage() {
    this.dataSource.loadPlaylist(
      this.id, '', this.sort.direction,
      this.paginator.pageIndex, this.paginator.pageSize);
  }

  onRowClicked(row) {
    console.log('Row clicked: ', row);
  }

}
