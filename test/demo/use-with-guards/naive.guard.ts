import { CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

export class NaiveGuard implements CanActivate {
	public canActivate( context: ExecutionContext ): boolean {
		const request = context.switchToHttp().getRequest<Request>();
		const authorization = request.header( 'Authorization' );
		if( !authorization ){
			// **BEWARE**: if the guard returns `false`, Nest will throw a `ForbiddenException` which is semantically incorrect here.
			// The user is not *missing the right to do*, it is *not authenticated at all*.
			throw new UnauthorizedException( 'Missing authorization header' );
		}
		const user = this._getUserFromAuthorization( authorization );
		if( !user ){
			return false;
		}
		( request as any ).user = user;
		return true;
	}

	private _getUserFromAuthorization( authorization?: string ){
		if( authorization === 'admin' ){
			return { role: 'admin' };
		} else if( authorization === 'user' ){
			return { role: 'user' };
		} else {
			return undefined;
		}
	}
}
