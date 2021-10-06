import { CanActivate, ExecutionContext, Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { lastValueFrom } from 'rxjs';

const isGuard = ( v: any ): v is CanActivate => typeof v === 'object' && v && 'canActivate' in v;

const canActivateGuardToPromise = ( guard: CanActivate, context: ExecutionContext ) => {
	try {
		const canActivate = guard.canActivate( context );
		if( typeof canActivate === 'boolean' ){
			return Promise.resolve( canActivate );
		} else if( 'then' in canActivate ){
			return canActivate;
		} else if( 'pipe' in canActivate ){
			return lastValueFrom( canActivate );
		} else {
			throw new TypeError( `Can't handle type of "canActivate" return "${canActivate}" for guard ${guard.constructor?.name ?? guard}` );
		}
	} catch( e ) {
		return Promise.reject( e );
	}
};

export const mergeGuardResults = async ( guards: readonly CanActivate[], context: ExecutionContext ): Promise<boolean> => {
	let firstRes: {error: Error} | {value: boolean} | null = null;
	for( const guard of guards ){
		try {
			const ret = await canActivateGuardToPromise( guard, context );
			if( ret ){
				return true;
			}
			firstRes = firstRes ?? { value: ret };
		} catch( e: any ) {
			firstRes = firstRes ?? { error: e };
		}
	}

	if( !firstRes ){
		throw new TypeError( 'No first result' );
	} else if( 'error' in firstRes ) {
		throw firstRes.error;
	} else {
		return firstRes.value;
	}
};

export const orGuard = ( guards: Array<Type<CanActivate> | string | symbol | CanActivate> ): Type<CanActivate> => {
	@Injectable()
	class OrGuard implements CanActivate {
		public constructor( private readonly _moduleRef: ModuleRef ){}

		/**
		 * Run all closure {@link guards} and check if at least one passed. Otherwise, returns the first `false` or exception.
		 *
		 * @param context - The execution context.
		 * @returns a promise resolving `true` if at least one child guard returned `true`. If all guards fails, the first value or error is returned.
		 */
		public canActivate( context: ExecutionContext ): Promise<boolean> {
			const guardsResolved = guards.map( g => isGuard( g ) ? g : this._moduleRef.get( g, { strict: false } ) );
			return mergeGuardResults( guardsResolved, context );
		}
	}
	return OrGuard;
};
