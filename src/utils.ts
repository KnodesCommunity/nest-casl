import { Injectable, Type } from '@nestjs/common';
import { isObject } from 'lodash';
import { Observable, lastValueFrom } from 'rxjs';

/**
 * An observable, promise, or sync value.
 */
export type MaybeAsyncValue<T> = T | Promise<T> | Observable<T>;
export const anyToPromise = <T>( fn: () => MaybeAsyncValue<T> ): Promise<T> => {
	try {
		const ret = fn();
		if( isObject( ret ) && 'then' in ret ){
			return ret;
		} else if( isObject( ret ) && 'pipe' in ret ){
			return lastValueFrom( ret );
		} else {
			return Promise.resolve( ret );
		}
	} catch( e ) {
		return Promise.reject( e );
	}
};

const SCOPE_OPTIONS_METADATA = ( () => {
	@Injectable()
	class FakeClass {}
	const metaKeys = Reflect.getMetadataKeys( FakeClass );
	if( metaKeys.length !== 1 ){
		throw new Error( 'Your version of NestJS is incompatible with this package !' );
	}
	return metaKeys[0];
} )();

export const isInjectable = ( fn: Type<any> | ( ( ...args: any[] ) => any ) ): fn is Type<any> => Reflect.hasMetadata( SCOPE_OPTIONS_METADATA, fn );
