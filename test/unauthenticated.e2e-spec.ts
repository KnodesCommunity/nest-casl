import { Ability } from '@casl/ability';
import { CanActivate, Controller, Get, HttpStatus, INestApplication, Injectable, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { CaslAbilityFactory, CaslModule, PoliciesMask, Policy, bindPolicy } from '../src';

class TestAbilityFactory implements CaslAbilityFactory {
	public readonly createFromRequest = jest.fn().mockReturnValue( new Ability() );
}

@Injectable()
class TestGuard implements CanActivate {
	public canActivate(): boolean {
		throw new UnauthorizedException();
	}
}

describe( 'Unauthenticated using guard', () => {
	let app: INestApplication;

	describe( 'Infix', () => {
		// #region infix
		@Controller( '/unauth/infix/global-policy' )
		@Policy( true )
			.usingGuard( TestGuard )
		class UnauthInfixGlobalPolicy {
			@Get()
			public unauthorized(){
				return 'SHOULD NEVER HAPPEN';
			}
		}

		@Controller( '/unauth/infix/method-policy' )
		class UnauthInfixMethodPolicy {
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

		@Controller( '/unauth/infix/policies-mask' )
		@PoliciesMask( {
			unprotected: true,
		} )
			.usingGuard( TestGuard )
		class UnauthInfixPoliciesMask {
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
					UnauthInfixGlobalPolicy, UnauthInfixMethodPolicy, UnauthInfixPoliciesMask,
				],
			} ).compile();

			app = moduleRef.createNestApplication();
			await app.init();
		} );

		describe( 'Policy', () => {
			describe( 'Global', () => {
				it( 'Unauthorized', () => request( app.getHttpServer() )
					.get( '/unauth/infix/global-policy' )
					.expect( HttpStatus.UNAUTHORIZED ) );
			} );
			describe( 'Method', () => {
				it( 'Unauthorized', () => request( app.getHttpServer() )
					.get( '/unauth/infix/method-policy/unauthorized' )
					.expect( HttpStatus.UNAUTHORIZED ) );
				it( 'Authorized', () => request( app.getHttpServer() )
					.get( '/unauth/infix/method-policy/unprotected' )
					.expect( HttpStatus.OK ) );
			} );
		} );
		describe( 'PoliciesMask', () => {
			it( 'Unauthorized', () => request( app.getHttpServer() )
				.get( '/unauth/infix/policies-mask/unauthorized' )
				.expect( HttpStatus.UNAUTHORIZED ) );
			it( 'Authorized', () => request( app.getHttpServer() )
				.get( '/unauth/infix/policies-mask/unprotected' )
				.expect( HttpStatus.OK ) );
		} );
	} );
	describe( 'Prefix', () => {
		// #region prefix
		const GuardWithTest = bindPolicy( TestGuard );

		@Controller( '/unauth/prefix/global-policy' )
		@GuardWithTest.Policy( true )
		class UnauthPrefixGlobalPolicy {
			@Get()
			public unauthorized(){
				return 'SHOULD NEVER HAPPEN';
			}
		}

		@Controller( '/unauth/prefix/method-policy' )
		class UnauthPrefixMethodPolicy {
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

		@Controller( '/unauth/prefix/policies-mask' )
		@GuardWithTest.PoliciesMask( {
			unprotected: true,
		} )
		class UnauthPrefixPoliciesMask {
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
					UnauthPrefixGlobalPolicy, UnauthPrefixMethodPolicy, UnauthPrefixPoliciesMask,
				],
			} ).compile();

			app = moduleRef.createNestApplication();
			await app.init();
		} );

		describe( 'Policy', () => {
			describe( 'Global', () => {
				it( 'Unauthorized', () => request( app.getHttpServer() )
					.get( '/unauth/prefix/global-policy' )
					.expect( HttpStatus.UNAUTHORIZED ) );
			} );
			describe( 'Method', () => {
				it( 'Unauthorized', () => request( app.getHttpServer() )
					.get( '/unauth/prefix/method-policy/unauthorized' )
					.expect( HttpStatus.UNAUTHORIZED ) );
				it( 'Authorized', () => request( app.getHttpServer() )
					.get( '/unauth/prefix/method-policy/unprotected' )
					.expect( HttpStatus.OK ) );
			} );
		} );
		describe( 'PoliciesMask', () => {
			it( 'Unauthorized', () => request( app.getHttpServer() )
				.get( '/unauth/prefix/policies-mask/unauthorized' )
				.expect( HttpStatus.UNAUTHORIZED ) );
			it( 'Authorized', () => request( app.getHttpServer() )
				.get( '/unauth/prefix/policies-mask/unprotected' )
				.expect( HttpStatus.OK ) );
		} );
	} );
} );
