import { Ability, AbilityBuilder } from '@casl/ability';
import { Controller, Get, HttpStatus, INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { CaslAbilityFactory, CaslModule, PoliciesMask, Policy } from '../src';

describe( 'Ability factory inheritance', () => {
	let app: INestApplication;

	@Controller( '/global-policy' )
	@Policy( { action: 'canModule2', subject: 'something' } )
	class GlobalPolicyController {
		@Get()
		public canModule2(){
			return 'canModule2';
		}
	}

	@Controller( '/method-policy' )
	class MethodPolicyController {
		@Get( 'cannot' )
		@Policy( { action: 'cannot', subject: 'something' } )
		public cannot(){
			return 'SHOULD NEVER HAPPEN';
		}

		@Get( 'canImmediate' )
		@Policy( { action: 'canImmediate', subject: 'something' } )
		public canImmediate(){
			return 'canImmediate';
		}

		@Get( 'canModule1' )
		@Policy( { action: 'canModule1', subject: 'something' } )
		public canModule1(){
			return 'canModule1';
		}

		@Get( 'canModule2' )
		@Policy( { action: 'canModule2', subject: 'something' } )
		public canModule2(){
			return 'canModule1';
		}
	}

	@Controller( '/policies-mask' )
	@PoliciesMask( {
		cannot: { action: 'cannot', subject: 'something' },
		canImmediate: { action: 'canImmediate', subject: 'something' },
		canModule1: { action: 'canModule1', subject: 'something' },
		canModule2: { action: 'canModule2', subject: 'something' },
	} )
	class PoliciesMaskController {
		@Get( 'cannot' )
		public cannot(){
			return 'SHOULD NEVER HAPPEN';
		}

		@Get( 'canImmediate' )
		public canImmediate(){
			return 'canImmediate';
		}

		@Get( 'canModule1' )
		public canModule1(){
			return 'canModule1';
		}

		@Get( 'canModule2' )
		public canModule2(){
			return 'canModule1';
		}
	}

	beforeAll( async () => {
		class TestBaseAbilityFactory implements CaslAbilityFactory {
			public createFromRequest(){
				return this.build().build();
			}
			protected build(){
				const ability = new AbilityBuilder( Ability );
				ability.can( 'canImmediate', 'something' );
				return ability;
			}
		}

		class TestBaseAbilityFactory1 extends TestBaseAbilityFactory {
			protected build(){
				const ability = super.build();
				ability.can( 'canModule1', 'something' );
				return ability;
			}
		}
		@Module( {
			imports: [ CaslModule.withConfig( { abilityFactory: TestBaseAbilityFactory1 } ) ],
		} )
		class Module1 {}

		class TestBaseAbilityFactory2 extends TestBaseAbilityFactory1 {
			protected build(){
				const ability = super.build();
				ability.can( 'canModule2', 'something' );
				return ability;
			}
		}
		@Module( {
			imports: [ CaslModule.withConfig( { abilityFactory: TestBaseAbilityFactory2 } ), Module1 ],
			controllers: [
				GlobalPolicyController, MethodPolicyController, PoliciesMaskController,
			],
		} )
		class Module2 {}

		const moduleRef = await Test.createTestingModule( {
			imports: [ CaslModule.withConfig( { abilityFactory: TestBaseAbilityFactory } ), Module2 ],
		} ).compile();

		app = moduleRef.createNestApplication();
		await app.init();
	} );

	describe( 'Policy', () => {
		describe( 'Global', () => {
			it( 'Authorized from module 2', () => request( app.getHttpServer() )
				.get( '/global-policy' )
				.expect( HttpStatus.OK ) );
		} );
		describe( 'Method', () => {
			it( 'Unauthorized', () => request( app.getHttpServer() )
				.get( '/method-policy/cannot' )
				.expect( HttpStatus.FORBIDDEN ) );
			it( 'Authorized immediate', () => request( app.getHttpServer() )
				.get( '/method-policy/canImmediate' )
				.expect( HttpStatus.OK ) );
			it( 'Authorized from module 1', () => request( app.getHttpServer() )
				.get( '/method-policy/canModule1' )
				.expect( HttpStatus.OK ) );
			it( 'Authorized from module 2', () => request( app.getHttpServer() )
				.get( '/method-policy/canModule2' )
				.expect( HttpStatus.OK ) );
		} );
	} );
	describe( 'PoliciesMask', () => {
		it( 'Unauthorized', () => request( app.getHttpServer() )
			.get( '/policies-mask/cannot' )
			.expect( HttpStatus.FORBIDDEN ) );
		it( 'Authorized immediate', () => request( app.getHttpServer() )
			.get( '/policies-mask/canImmediate' )
			.expect( HttpStatus.OK ) );
		it( 'Authorized from module 1', () => request( app.getHttpServer() )
			.get( '/policies-mask/canModule1' )
			.expect( HttpStatus.OK ) );
		it( 'Authorized from module 2', () => request( app.getHttpServer() )
			.get( '/policies-mask/canModule2' )
			.expect( HttpStatus.OK ) );
	} );
} );
