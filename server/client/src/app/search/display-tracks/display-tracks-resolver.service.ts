import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {EMPTY, Observable, of, throwError} from "rxjs";
import {TrackFull} from "../../models/spotifyData.model";
import {catchError, mergeMap, switchMap, take, tap} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class DisplayTracksResolverService implements Resolve<Observable<TrackFull[]>> {

  constructor(private http: HttpClient) {

  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<TrackFull[]> | Observable<never> {
    const id = route.params.id;
    const category = route.params.type;
    return this.http.get('http://ip-api.com/json')
      .pipe(
        switchMap(isoCode => {
          return this.getTracks(id, category, isoCode)
        })
      )
  }


  getTracks(id: string, category: string, iso): Observable<Observable<TrackFull[]>> | Observable<never> | Observable<any> {
    const isoCode = iso['countryCode'];
    const url = 'api/spotify/tracks';
    return of(this.http.get<TrackFull[]>(url, {
      params: new HttpParams()
        .set('id', id)
        .set('type', category)
        .set('iso', isoCode)
    })
      .pipe(
        catchError( () => this.handleError()),//navgiate from here
        tap(res => console.log(res)),
        take(1),//TEST
        mergeMap(
          res => {
            if (res['payload']) {
              const mappedTracks = res['payload']['data'].map((tr) => new TrackFull().deserialize(tr));
              return of(mappedTracks)
            } else {//navigate to not found page
              return this.handleError();
            }
          })
      ));
  }

  handleError() {
    //navigate to not found page
    return of([false]);
  }
}

