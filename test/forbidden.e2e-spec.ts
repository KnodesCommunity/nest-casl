import { Ability, AbilityBuilder } from '@casl/ability';
import { Controller, Get, HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { CaslAbilityFactory, CaslModule, PoliciesMask, Policy } from '../src';

class TestAbilityFactory implements CaslAbilityFactory {
	public readonly createFromRequest = () => {
		const ability = new AbilityBuilder( Ability );
		ability.can( 'can', 'something' );
		return ability.build();
	};
}

describe( 'Forbidden', () => {
	let app: INestApplication;

	@Controller( '/global-policy' )
	@Policy( { action: 'cannot', subject: 'something' } )
	class GlobalPolicyController {
		@Get()
		public cannot(){
			return 'SHOULD NEVER HAPPEN';
		}
	}

	@Controller( '/method-policy' )
	class MethodPolicyController {
		@Get( 'cannot' )
		@Policy( { action: 'cannot', subject: 'something' } )
		public cannot(){
			return 'SHOULD NEVER HAPPEN';
		}

		@Get( 'can' )
		@Policy( { action: 'can', subject: 'something' } )
		public can(){
			return 'can';
		}
	}

	@Controller( '/policies-mask' )
	@PoliciesMask( {
		cannot: { action: 'cannot', subject: 'something' },
		can: { action: 'can', subject: 'something' },
	} )
	class PoliciesMaskController {
		@Get( 'cannot' )
		public cannot(){
			return 'SHOULD NEVER HAPPEN';
		}

		@Get( 'can' )
		public can(){
			return 'can';
		}
	}

	beforeAll( async () => {
		const moduleRef = await Test.createTestingModule( {
			imports: [ CaslModule.withConfig( { abilityFactory: TestAbilityFactory } ) ],
			controllers: [
				GlobalPolicyController, MethodPolicyController, PoliciesMaskController,
			],
		} ).compile();

		app = moduleRef.createNestApplication();
		await app.init();
	} );

	describe( 'Policy', () => {
		describe( 'Global', () => {
			it( 'Unauthorized', () => request( app.getHttpServer() )
				.get( '/global-policy' )
				.expect( HttpStatus.FORBIDDEN ) );
		} );
		describe( 'Method', () => {
			it( 'Unauthorized', () => request( app.getHttpServer() )
				.get( '/method-policy/cannot' )
				.expect( HttpStatus.FORBIDDEN ) );
			it( 'Authorized', () => request( app.getHttpServer() )
				.get( '/method-policy/can' )
				.expect( HttpStatus.OK ) );
		} );
	} );
	describe( 'PoliciesMask', () => {
		it( 'Unauthorized', () => request( app.getHttpServer() )
			.get( '/policies-mask/cannot' )
			.expect( HttpStatus.FORBIDDEN ) );
		it( 'Authorized', () => request( app.getHttpServer() )
			.get( '/policies-mask/can' )
			.expect( HttpStatus.OK ) );
	} );
} );
