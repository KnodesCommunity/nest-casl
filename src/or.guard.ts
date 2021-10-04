import { CanActivate, ExecutionContext, Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Observable, catchError, dematerialize, filter, first, from, materialize, of, shareReplay, switchMap, takeLast, throwError } from 'rxjs';

const isGuard = ( v: any ): v is CanActivate => typeof v === 'object' && v && 'canActivate' in v;

export const orGuard = ( guards: Array<Type<CanActivate> | string | symbol | CanActivate> ): Type<CanActivate> => {
	@Injectable()
	class OrGuard implements CanActivate {
		public constructor( private readonly _moduleRef: ModuleRef ){}

		/**
		 * Run all closure {@link guards} and check if at least one passed. Otherwise, returns the first `false` or exception.
		 *
		 * @param context - The execution context.
		 * @returns an observable emitting `true` if at least one child guard returned `true`.
		 */
		public canActivate( context: ExecutionContext ): Observable<boolean> {
			const guardsResolved = guards.map( g => isGuard( g ) ? g : this._moduleRef.get( g, { strict: false } ) );
			const resolutions = of( ...guardsResolved )
				.pipe(
					switchMap( g => this._canActivateChildGuard( g, context )
						.pipe( takeLast( 1 ), materialize(), filter( m => m.kind !== 'C' ) ) ),
					shareReplay() );
			return resolutions
				.pipe(
					first( n => n.kind === 'N' && n.value ),
					catchError( err => {
						if( err.name === 'EmptyError' ){
							return resolutions.pipe( first() );
						}
						return resolutions
							.pipe( filter( n => n.kind !== 'N' || ( n.kind === 'N' && !n.value ) ) );
					} ),
					dematerialize() );
		}

		/**
		 * Run the given {@link guard} using the given {@link context}, and normalize its return to an observable.
		 *
		 * @param guard - The guard to run.
		 * @param context - The execution context.
		 * @returns an observable emitting `true` if access is allowed, or `false` or throw an error otherwise.
		 */
		private _canActivateChildGuard( guard: CanActivate, context: ExecutionContext ): Observable<boolean> {
			try {
				const canActivate = guard.canActivate( context );
				if( typeof canActivate === 'boolean' ){
					return of( canActivate );
				} else if( 'then' in canActivate ){
					return from( canActivate );
				} else if( 'pipe' in canActivate ){
					return canActivate;
				}
			} catch( e ) {
				return throwError( () => e );
			}
		}
	}
	return OrGuard;
};
