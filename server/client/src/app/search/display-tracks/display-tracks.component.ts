import {Component, OnDestroy, OnInit} from '@angular/core';
import {Album, Artist, Playlist, TrackFull} from "../../models/spotifyData.model";
import {SearchService} from "../search.service";
import {ActivatedRoute, Router} from "@angular/router";
import {MatDialog, MatDialogConfig, MatIconRegistry} from "@angular/material";
import {DomSanitizer} from "@angular/platform-browser";
import {PlaylistService} from "../../services/playlist.service";
import {delay, switchMap, take, tap} from "rxjs/operators";
import {Observable, Subject} from "rxjs";
import {AppStateStore} from "../../store/app-state.store";
import {PopUpComponent} from "../../pop-up/pop-up.component";
import {untilComponentDestroyed} from "@w11k/ngx-componentdestroyed";


@Component({
  selector: 'app-display-track',
  templateUrl: './display-tracks.component.html',
  styleUrls: ['./display-tracks.component.scss']
})
export class DisplayTracksComponent implements OnInit, OnDestroy {

  dataSource: Observable<TrackFull[]>;
  resolverEvent$: Observable<Observable<TrackFull[]>> | Observable<any>;
  private playlist: Playlist;
  private currentEntity: Album | Artist;
  loading: boolean = true;
  destroy$ = new Subject<boolean>();
  displayedColumns = ["name", "album", "artist", "duration", "externalSource"];

  constructor(private router: Router,
              private searchService: SearchService,
              private activatedRoute: ActivatedRoute,
              private playlistService: PlaylistService,
              private appStateStore: AppStateStore,
              private dialog: MatDialog,
              iconRegistry: MatIconRegistry,
              sanitizer: DomSanitizer) {

    this.appStateStore.state$.subscribe(
      res => {
        console.log(res)
        this.playlist = res['currentPlaylist'];
        this.currentEntity = res['currentEntity'];
      });

    this.resolverEvent$ = this.activatedRoute.data
      .pipe(
        untilComponentDestroyed(this),
        tap(() => this.loading = true),
        take(1),//immediately unsubscribe after 1 val (initial empty = 1, data = 2)//new test this
        delay(5000),
        switchMap((data) => data.trackData));

    this.resolverEvent$.subscribe(
      res => {
        this.dataSource = res;
        this.loading = false;
      },
      error => console.error(error)
    );

    iconRegistry.addSvgIcon(
      'baseline-arrow-back',
      sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/baseline-arrow_back_ios-24px.svg'));
  }

  ngOnInit() {
    // this.dataSource$ = this.activatedRoute.data.pipe(map(data => data.trackData));
  }

  ngOnDestroy() {
    this.destroy$.next(true);
  }

  navigateToSearch() {
    this.router.navigate(['/playlist-add', this.playlist.playlist_id]);
  }

  onSelect(track: TrackFull) {
    this.playlistService.addTrackToCurrentPlaylist(track.track_uri, this.playlist.playlist_id)
      .pipe(untilComponentDestroyed(this))
      .subscribe(
        res => {
          if (res.snapshot_id) {
            this.playlist.snapshot_id = res.snapshot_id;
            this.appStateStore.addCurrentPlaylist(this.playlist);
            this.openPopUp(track.name);
          }
        }
      )
  }

  openPopUp(msg: string) {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      addTrack: true,
      title: 'Add track',
      content: msg + ' has been added to ' + this.playlist.name
    };
    this.dialog.open(PopUpComponent, dialogConfig);
  }
}
