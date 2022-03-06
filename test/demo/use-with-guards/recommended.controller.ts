import { BadRequestException, CanActivate, Controller, ExecutionContext, Get, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Policy } from '@knodes/nest-casl';

// #region RecommendedSimpleController
@Controller( '/recommended' )
@Policy( { action: 'admin', subject: 'something' } )
	.usingGuard( AuthGuard( 'jwt' ) ) // The policy will run the guard before doing its own checks.
export class RecommendedTestController {
	@Get()
	public method(){
		// ...
	}
}
// #endregion

// #region RecommendedBound
export const AdminViaJwtPolicy = Policy( { action: 'admin', subject: 'something' } )
	.usingGuard( AuthGuard( 'jwt' ) );
export const ViaJwtPolicy = Policy.usingGuard( AuthGuard( 'jwt' ) );
// #endregion

// #region RecommendedBoundController
@Injectable()
export class ExtraGuard1 implements CanActivate {
	public canActivate( context: ExecutionContext ): boolean {
		if( !context.switchToHttp().getRequest().user.allowed1 ){
			throw new BadRequestException( 'Not allowed from ExtraGuard1' );
		}
		return true;
	}
}
@Injectable()
export class ExtraGuard2 implements CanActivate {
	public canActivate( context: ExecutionContext ): boolean {
		return context.switchToHttp().getRequest().user.allowed2 ?? false;
	}
}

@Controller( '/recommended/bound' )
export class RecommendedBoundTestController {
	@Get( 'method1' )
	@AdminViaJwtPolicy
		.usingGuard( [ ExtraGuard1, ExtraGuard2 ] ) // Add guards. When passed as an array, if either one can activate, it will continue
	public method1(){
		// ...
	}

	@Get( 'method2' )
	@ViaJwtPolicy( { action: 'admin', subject: 'something' } )
		.usingGuard( [ ExtraGuard1, ExtraGuard2 ] ) // Add guards. When passed as an array, if either one can activate, it will continue
	public method2(){
		// ...
	}
}
// #endregion

// #region Recommended preset
// const JwtGuard =
// #endregion
