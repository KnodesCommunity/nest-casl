import { CanActivate, ExecutionContext, Injectable, Type, UnauthorizedException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Observable, map } from 'rxjs';

const isGuard = ( v: any ): v is CanActivate => typeof v === 'object' && v && 'canActivate' in v;

export const wrapGuard = ( guardClass: Type<CanActivate> | string | symbol | CanActivate ): Type<CanActivate> => {
	@Injectable()
	class Custom implements CanActivate {
		public constructor( private readonly _moduleRef: ModuleRef ){}

		/**
		 * @param context
		 */
		public canActivate( context: ExecutionContext ): boolean | Promise<boolean> | Observable<boolean> {
			const guard = isGuard( guardClass ) ? guardClass : this._moduleRef.get( guardClass, { strict: false } );
			const canActivate = guard.canActivate( context );
			if( typeof canActivate === 'boolean' ){
				return this._handleGuardResult( canActivate );
			} else if( 'then' in canActivate ){
				return canActivate.then( c => this._handleGuardResult( c ) );
			} else if( 'pipe' in canActivate ){
				return canActivate.pipe( map( c => this._handleGuardResult( c ) ) );
			}
		}

		/**
		 * @param can
		 */
		private _handleGuardResult( can: boolean ) {
			if( !can ){
				throw new UnauthorizedException();
			}
			return true;
		}
	}
	return Custom;
};
