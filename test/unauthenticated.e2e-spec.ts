import { Ability } from '@casl/ability';
import { CanActivate, Controller, Get, HttpStatus, INestApplication, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { CaslAbilityFactory, CaslModule, PoliciesMask, Policy, bindPolicy } from '../src';

class TestAbilityFactory implements CaslAbilityFactory {
	public readonly createFromRequest = () => new Ability();
}

@Injectable()
class TestGuard implements CanActivate {
	public canActivate(): boolean {
		return false;
	}
}

describe( 'Unauthenticated using guard', () => {
	let app: INestApplication;

	describe( 'Infix', () => {
		// #region infix
		@Controller( '/infix/global-policy' )
		@Policy( true )
			.usingGuard( TestGuard )
		class GlobalPolicyController {
			@Get()
			public unauthorized(){
				return 'SHOULD NEVER HAPPEN';
			}
		}

		@Controller( '/infix/method-policy' )
		class MethodPolicyController {
			@Get( 'unauthorized' )
			@Policy( true )
				.usingGuard( TestGuard )
			public unauthorized(){
				return 'SHOULD NEVER HAPPEN';
			}

			@Get( 'unprotected' )
			public unprotected(){
				return 'unprotected';
			}
		}

		@Controller( '/infix/policies-mask' )
		@PoliciesMask( {
			unprotected: true,
		} )
			.usingGuard( TestGuard )
		class PoliciesMaskController {
			@Get( 'unauthorized' )
			public unauthorized(){
				return 'SHOULD NEVER HAPPEN';
			}

			@Get( 'unprotected' )
			public unprotected(){
				return 'unprotected';
			}
		}
		// #endregion

		beforeAll( async () => {
			const moduleRef = await Test.createTestingModule( {
				imports: [ CaslModule.forRoot( { abilityFactory: TestAbilityFactory } ) ],
				controllers: [
					GlobalPolicyController, MethodPolicyController, PoliciesMaskController,
				],
				providers: [ TestGuard ],
			} ).compile();

			app = moduleRef.createNestApplication();
			await app.init();
		} );

		describe( 'Policy', () => {
			describe( 'Global', () => {
				it( 'Unauthorized', () => request( app.getHttpServer() )
					.get( '/infix/global-policy' )
					.expect( HttpStatus.UNAUTHORIZED ) );
			} );
			describe( 'Method', () => {
				it( 'Unauthorized', () => request( app.getHttpServer() )
					.get( '/infix/method-policy/unauthorized' )
					.expect( HttpStatus.UNAUTHORIZED ) );
				it( 'Authorized', () => request( app.getHttpServer() )
					.get( '/infix/method-policy/unprotected' )
					.expect( HttpStatus.OK ) );
			} );
		} );
		describe( 'PoliciesMask', () => {
			it( 'Unauthorized', () => request( app.getHttpServer() )
				.get( '/infix/policies-mask/unauthorized' )
				.expect( HttpStatus.UNAUTHORIZED ) );
			it( 'Authorized', () => request( app.getHttpServer() )
				.get( '/infix/policies-mask/unprotected' )
				.expect( HttpStatus.OK ) );
		} );
	} );
	describe( 'Prefix', () => {
		// #region prefix
		const GuardWithTest = bindPolicy( TestGuard );

		@Controller( '/prefix/global-policy' )
		@GuardWithTest.Policy( true )
		class GlobalPolicyController {
			@Get()
			public unauthorized(){
				return 'SHOULD NEVER HAPPEN';
			}
		}

		@Controller( '/prefix/method-policy' )
		class MethodPolicyController {
			@Get( 'unauthorized' )
			@GuardWithTest.Policy( true )
			public unauthorized(){
				return 'SHOULD NEVER HAPPEN';
			}

			@Get( 'unprotected' )
			public unprotected(){
				return 'unprotected';
			}
		}

		@Controller( '/prefix/policies-mask' )
		@GuardWithTest.PoliciesMask( {
			unprotected: true,
		} )
		class PoliciesMaskController {
			@Get( 'unauthorized' )
			public unauthorized(){
				return 'SHOULD NEVER HAPPEN';
			}

			@Get( 'unprotected' )
			public unprotected(){
				return 'unprotected';
			}
		}
		// #endregion

		beforeAll( async () => {
			const moduleRef = await Test.createTestingModule( {
				imports: [ CaslModule.forRoot( { abilityFactory: TestAbilityFactory } ) ],
				controllers: [
					GlobalPolicyController, MethodPolicyController, PoliciesMaskController,
				],
				providers: [ TestGuard ],
			} ).compile();

			app = moduleRef.createNestApplication();
			await app.init();
		} );

		describe( 'Policy', () => {
			describe( 'Global', () => {
				it( 'Unauthorized', () => request( app.getHttpServer() )
					.get( '/prefix/global-policy' )
					.expect( HttpStatus.UNAUTHORIZED ) );
			} );
			describe( 'Method', () => {
				it( 'Unauthorized', () => request( app.getHttpServer() )
					.get( '/prefix/method-policy/unauthorized' )
					.expect( HttpStatus.UNAUTHORIZED ) );
				it( 'Authorized', () => request( app.getHttpServer() )
					.get( '/prefix/method-policy/unprotected' )
					.expect( HttpStatus.OK ) );
			} );
		} );
		describe( 'PoliciesMask', () => {
			it( 'Unauthorized', () => request( app.getHttpServer() )
				.get( '/prefix/policies-mask/unauthorized' )
				.expect( HttpStatus.UNAUTHORIZED ) );
			it( 'Authorized', () => request( app.getHttpServer() )
				.get( '/prefix/policies-mask/unprotected' )
				.expect( HttpStatus.OK ) );
		} );
	} );
} );
