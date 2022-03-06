import { HttpStatus, INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { CaslModule } from '@knodes/nest-casl';

import { AbilityFactory } from './ability-factory.service';
import { JwtPassportStrategy } from './jwt-passport.strategy';
import { ExtraGuard1, ExtraGuard2, RecommendedBoundTestController, RecommendedTestController } from './recommended.controller';

describe( 'Use with guards (recommended)', () => {
	let app: INestApplication;

	describe( 'RecommendedTestController', () => {
		beforeAll( async () => {
			const moduleRef = await Test.createTestingModule( {
				imports: [
					CaslModule.withConfig( ( { abilityFactory: AbilityFactory } ) ),
					JwtModule.register( { secret: JwtPassportStrategy.KEY } ),
				],
				providers: [ JwtPassportStrategy ],
				controllers: [ RecommendedTestController ],
			} ).compile();

			app = moduleRef.createNestApplication();
			await app.init();
		} );

		it( 'should send an UNAUTHORIZED error if no authorization set', () => request( app.getHttpServer() )
			.get( '/recommended' )
			.expect( HttpStatus.UNAUTHORIZED )
			.expect( { statusCode: HttpStatus.UNAUTHORIZED, message: 'Unauthorized' } ) );
		it( 'should send a FORBIDDEN error if invalid capabilities', () => request( app.getHttpServer() )
			.get( '/recommended' )
			.set( 'Authorization', `Bearer ${app.get( JwtService ).sign( { role: 'user' } )}` )
			.expect( HttpStatus.FORBIDDEN )
			.expect( { statusCode: HttpStatus.FORBIDDEN, message: 'Invalid authorizations: Can\'t "admin" on "something"', error: 'Forbidden' } ) );
		it( 'should work', () => request( app.getHttpServer() )
			.get( '/recommended' )
			.set( 'Authorization', `Bearer ${app.get( JwtService ).sign( { role: 'admin' } )}` )
			.expect( HttpStatus.OK ) );
	} );
	describe( 'RecommendedBoundTestController', () => {
		beforeAll( async () => {
			const moduleRef = await Test.createTestingModule( {
				imports: [
					CaslModule.withConfig( ( { abilityFactory: AbilityFactory } ) ),
					JwtModule.register( { secret: JwtPassportStrategy.KEY } ),
				],
				providers: [ JwtPassportStrategy, ExtraGuard1, ExtraGuard2 ],
				controllers: [ RecommendedBoundTestController ],
			} ).compile();

			app = moduleRef.createNestApplication();
			await app.init();
		} );

		describe.each( [ 'method1', 'method2' ] )( 'On method %s', method => {
			const endpoint = `/recommended/bound/${method}`;
			it( 'should send an UNAUTHORIZED error if no authorization set', () => request( app.getHttpServer() )
				.get( endpoint )
				.expect( HttpStatus.UNAUTHORIZED )
				.expect( { statusCode: HttpStatus.UNAUTHORIZED, message: 'Unauthorized' } ) );
			it( 'should send a FORBIDDEN error if passing neither guard 1 nor 2, and throw error from guard 1', () => request( app.getHttpServer() )
				.get( endpoint )
				.set( 'Authorization', `Bearer ${app.get( JwtService ).sign( { role: 'user', allowed1: false, allowed2: false } )}` )
				.expect( HttpStatus.BAD_REQUEST )
				.expect( { statusCode: HttpStatus.BAD_REQUEST, message: 'Not allowed from ExtraGuard1', error: 'Bad Request' } ) );
			it( 'should send a FORBIDDEN error if passing guard 1 invalid capabilities', () => request( app.getHttpServer() )
				.get( endpoint )
				.set( 'Authorization', `Bearer ${app.get( JwtService ).sign( { role: 'user', allowed1: true } )}` )
				.expect( HttpStatus.FORBIDDEN )
				.expect( { statusCode: HttpStatus.FORBIDDEN, message: 'Invalid authorizations: Can\'t "admin" on "something"', error: 'Forbidden' } ) );
			it( 'should send a FORBIDDEN error if passing guard 2 invalid capabilities', () => request( app.getHttpServer() )
				.get( endpoint )
				.set( 'Authorization', `Bearer ${app.get( JwtService ).sign( { role: 'user', allowed2: true } )}` )
				.expect( HttpStatus.FORBIDDEN )
				.expect( { statusCode: HttpStatus.FORBIDDEN, message: 'Invalid authorizations: Can\'t "admin" on "something"', error: 'Forbidden' } ) );
			it( 'should work via guard 1', () => request( app.getHttpServer() )
				.get( endpoint )
				.set( 'Authorization', `Bearer ${app.get( JwtService ).sign( { role: 'admin', allowed1: true } )}` )
				.expect( HttpStatus.OK ) );
			it( 'should work via guard 2', () => request( app.getHttpServer() )
				.get( endpoint )
				.set( 'Authorization', `Bearer ${app.get( JwtService ).sign( { role: 'admin', allowed2: true } )}` )
				.expect( HttpStatus.OK ) );
		} );
	} );
} );
