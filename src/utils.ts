import { Type } from '@nestjs/common';
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

export const isInjectable = ( fn: Type<any> | ( ( ...args: any[] ) => any ) ): fn is Type<any> => Reflect.hasMetadata( '__injectable__', fn );
