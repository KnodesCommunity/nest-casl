import { AbilityBuilder, PureAbility } from '@casl/ability';
import { Body, Controller, Get, HttpStatus, INestApplication, Injectable, Module, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { CaslAbilityFactory, CaslModule, PoliciesMask, Policy } from '@knodes/nest-casl';

// #region AbilityFactory
@Injectable()
export class AbilityFactory implements CaslAbilityFactory {
	// Here, `request` is the express or fastify request. You might get infos from it.
	public createFromRequest( _request: unknown ): PureAbility {
		const abilityBuilder = new AbilityBuilder( PureAbility );
		abilityBuilder.can( 'feed', 'cat' );
		abilityBuilder.can( 'hug', 'cat' );
		abilityBuilder.cannot( 'rename', 'cat' );
		return abilityBuilder.build();
	}
}
// #endregion

// #region AppModule
@Module( {
	imports: [
		CaslModule.withConfig( ( { abilityFactory: AbilityFactory } ) ),
		// ....
	],
} )
export class AppModule {}
// #endregion

// #region CatOwnerController
@Controller( '/cat/owner' )
@Policy( { action: 'rename', subject: 'cat' } )
export class CatOwnerController {
	// Given the ability builder above, this method will always reject.
	@Post( 'rename' )
	public rename( @Body() _name: string ){
		// ...
	}
}
// #endregion

// #region CatCareController
@Controller( '/cat/care' )
export class CatCareController {
	// Okay, you can feed.
	@Get( 'feed' )
	@Policy( { action: 'feed', subject: 'cat' } )
	public feed(){
		// ...
	}

	// Well, I guess he won't bite.
	@Get( 'hug' )
	@Policy( { action: 'hug', subject: 'cat' } )
	public hug(){
		// ...
	}
}
// #endregion

// #region CatController
@Controller( '/cat' )
@PoliciesMask( {
	feed: { action: 'feed', subject: 'cat' },
	hug: { action: 'hug', subject: 'cat' },
	rename: { action: 'rename', subject: 'cat' },
} )
export class CatController {
	@Get( 'feed' )
	public feed(){
		// ...
	}

	@Get( 'hug' )
	public hug(){
		// ...
	}

	@Post( 'rename' )
	public rename( @Body() _name: string ){
		// ...
	}
}
// #endregion


// #region Test
describe( 'Basic usage', () => {
	let app: INestApplication;

	beforeAll( async () => {
		const moduleRef = await Test.createTestingModule( {
			imports: [ CaslModule.withConfig( { abilityFactory: AbilityFactory } ) ],
			controllers: [
				CatOwnerController, CatCareController, CatController,
			],
		} ).compile();

		app = moduleRef.createNestApplication();
		await app.init();
	} );

	describe( 'CatOwnerController', () => {
		it( 'should not be able to rename a cat', () => request( app.getHttpServer() )
			.post( '/cat/owner/rename' )
			.expect( HttpStatus.FORBIDDEN ) );
	} );
	describe( 'CatCareController', () => {
		it( 'should be able to feed the cat', () => request( app.getHttpServer() )
			.get( '/cat/care/feed' )
			.expect( HttpStatus.OK ) );
		it( 'should be able to hug the cat', () => request( app.getHttpServer() )
			.get( '/cat/care/hug' )
			.expect( HttpStatus.OK ) );
	} );
	describe( 'PoliciesMask', () => {
		it( 'should not be able to rename a cat', () => request( app.getHttpServer() )
			.post( '/cat/rename' )
			.expect( HttpStatus.FORBIDDEN ) );
		it( 'should be able to feed the cat', () => request( app.getHttpServer() )
			.get( '/cat/feed' )
			.expect( HttpStatus.OK ) );
		it( 'should be able to hug the cat', () => request( app.getHttpServer() )
			.get( '/cat/hug' )
			.expect( HttpStatus.OK ) );
	} );
} );
// #endregion
