import { HttpStatus, INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { CaslModule } from '@knodes/nest-casl';

import { AbilityFactory } from './ability-factory.service';
import { JwtPassportStrategy } from './jwt-passport.strategy';
import { NaiveTestController } from './naive.controller';
import { PassportNaiveTestController } from './passport-naive.controller';

describe( 'Use with guards (naive)', () => {
	let app: INestApplication;

	describe( 'NaiveTestController', () => {
		beforeAll( async () => {
			const moduleRef = await Test.createTestingModule( {
				imports: [
					CaslModule.withConfig( ( { abilityFactory: AbilityFactory } ) ),
				],
				controllers: [ NaiveTestController ],
			} ).compile();

			app = moduleRef.createNestApplication();
			await app.init();
		} );

		it( 'should send an UNAUTHORIZED error if no authorization set', () => request( app.getHttpServer() )
			.get( '/naive' )
			.expect( HttpStatus.UNAUTHORIZED )
			.expect( { statusCode: HttpStatus.UNAUTHORIZED, message: 'Missing authorization header', error: 'Unauthorized' } ) );
		it( 'should send a FORBIDDEN error if invalid authorization', () => request( app.getHttpServer() )
			.get( '/naive' )
			.set( 'Authorization', 'invalid' )
			.expect( HttpStatus.FORBIDDEN )
			.expect( { statusCode: HttpStatus.FORBIDDEN, message: 'Forbidden resource', error: 'Forbidden' } ) );
		it( 'should send a FORBIDDEN error if invalid capabilities', () => request( app.getHttpServer() )
			.get( '/naive' )
			.set( 'Authorization', 'user' )
			.expect( HttpStatus.FORBIDDEN )
			.expect( { statusCode: HttpStatus.FORBIDDEN, message: 'Invalid authorizations: Can\'t "admin" on "something"', error: 'Forbidden' } ) );
		it( 'should work', () => request( app.getHttpServer() )
			.get( '/naive' )
			.set( 'Authorization', 'admin' )
			.expect( HttpStatus.OK ) );
	} );
	describe( 'PassportNaiveTestController', () => {
		beforeAll( async () => {
			const moduleRef = await Test.createTestingModule( {
				imports: [
					CaslModule.withConfig( ( { abilityFactory: AbilityFactory } ) ),
					JwtModule.register( { secret: JwtPassportStrategy.KEY } ),
				],
				providers: [ JwtPassportStrategy ],
				controllers: [ PassportNaiveTestController ],
			} ).compile();

			app = moduleRef.createNestApplication();
			await app.init();
		} );

		it( 'should send an UNAUTHORIZED error if no authorization set', () => request( app.getHttpServer() )
			.get( '/passport/naive' )
			.expect( HttpStatus.UNAUTHORIZED )
			.expect( { statusCode: HttpStatus.UNAUTHORIZED, message: 'Unauthorized' } ) );
		it( 'should send a FORBIDDEN error if invalid capabilities', () => request( app.getHttpServer() )
			.get( '/passport/naive' )
			.set( 'Authorization', `Bearer ${app.get( JwtService ).sign( { role: 'user' } )}` )
			.expect( HttpStatus.FORBIDDEN )
			.expect( { statusCode: HttpStatus.FORBIDDEN, message: 'Invalid authorizations: Can\'t "admin" on "something"', error: 'Forbidden' } ) );
		it( 'should work', () => request( app.getHttpServer() )
			.get( '/passport/naive' )
			.set( 'Authorization', `Bearer ${app.get( JwtService ).sign( { role: 'admin' } )}` )
			.expect( HttpStatus.OK ) );
	} );
} );
