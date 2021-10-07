import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';

import { CaslAbilityFactory } from './casl-ability.factory';
import { addPolicyMetadata } from './decorators/proto-utils';

import { PoliciesGuard } from './policies.guard';
import { createFakeExecutionContext } from './test-utils';
import { IPolicy } from './types';
import { MaybeAsyncValue } from './utils';

describe( 'PoliciesGuard', () => {
	let guard: PoliciesGuard;
	let abilityFactory: MockCaslAbilityFactory;
	let request: any;
	let context: jest.Mocked<ExecutionContext>;
	let module: TestingModule;

	class MockCaslAbilityFactory implements CaslAbilityFactory<any> {
		public createFromRequest = jest.fn() as jest.MockedFunction<CaslAbilityFactory<any>['createFromRequest']>;
	}
	@Injectable()
	class InjectableHandler implements IPolicy {
		public handle(): MaybeAsyncValue<boolean> {
			return false;
		}
	}
	const providerString = 'SOME_PROVIDER_BY_STRING';
	const providerSymbol = Symbol( 'SOME_PROVIDER_BY_SYMBOL' );
	beforeEach( () => jest.clearAllMocks() );
	beforeEach( async () => {
		module = await Test.createTestingModule( {
			providers: [
				PoliciesGuard,
				{ provide: CaslAbilityFactory, useClass: MockCaslAbilityFactory },

				InjectableHandler,
				{ provide: providerString, useValue: { handle: jest.fn().mockReturnValue( false ) }},
				{ provide: providerSymbol, useValue: { handle: jest.fn().mockReturnValue( false ) }},
			],
		} ).compile();

		( { request, context } = createFakeExecutionContext() );
		guard = module.get( PoliciesGuard );
		abilityFactory = module.get<MockCaslAbilityFactory>( CaslAbilityFactory );
	} );

	it( 'should be defined', () => {
		expect( guard ).toBeDefined();
	} );

	it( 'should set the ability on the request', async () => {
		const mockAbility = {} as any;
		abilityFactory.createFromRequest.mockResolvedValue( mockAbility );
		await guard.canActivate( context );
		expect( request.ability ).toBe( mockAbility );
	} );
	const addHandler = ( spyGetter: jest.MockInstance<any, any[]>, handler: any ) => {
		const subject = ( spyGetter.mock as any ).subject = ( spyGetter.mock as any ).subject ?? ( () => undefined );
		addPolicyMetadata( handler )( subject );
		spyGetter.mockReturnValue( subject );
		( spyGetter.mock as any ).subject = subject;
	};
	const checkGuardResult = ( expected: boolean ) => {
		if( expected ){
			return expect( guard.canActivate( context ) ).resolves.toBe( expected );
		} else {
			return expect( guard.canActivate( context ) ).rejects.toThrowWithMessage( ForbiddenException, /^Invalid authorizations: / );
		}
	};
	describe( 'Individual handlers', () => {
		it.each( [
			[ true, undefined ],
			[ true,  true ],
			[ false, false ],
			[ false,  InjectableHandler ],
			[ false, () => false ],
			[ false, { action: 'cannot', subject: 'something' } ],
			[ false, { handle: () => false } ],
			[ false, providerString ],
			[ false, providerSymbol ],
		] )( 'should return %p for %p', async ( expected, handler ) => {
			abilityFactory.createFromRequest.mockResolvedValue( {
				can: jest.fn().mockImplementation( ( { action } ) => action === 'can' ),
			} );
			if( typeof handler !== 'undefined' ){
				addHandler( context.getHandler, handler );
			}
			await checkGuardResult( expected );
		} );
		it( 'should throw if an invalid handler is passed', async () => {
			addHandler( context.getHandler, { foo: 'bar' } );
			await expect( guard.canActivate( context ) ).rejects.toThrowWithMessage( TypeError, /^Invalid handler type/ );
		} );
		describe( 'Async handlers', () => {
			const asyncSamples = [
				[ false, Promise.resolve( false ) ],
				[ true, Promise.resolve( true ) ],
				[ false, of( false ) ],
				[ true, of( true ) ],
			] as const;
			describe.each( [
				[ 'Injected handler by class', ( returned: any ) => {
					jest.spyOn( InjectableHandler.prototype, 'handle' ).mockReturnValue( returned );
					return InjectableHandler;
				} ],
				[ 'Injected handler by string token', ( returned: any ) => {
					module.get( providerString ).handle.mockReturnValue( returned );
					return providerString;
				} ],
				[ 'Injected handler by symbol token', ( returned: any ) => {
					module.get( providerSymbol ).handle.mockReturnValue( returned );
					return providerSymbol;
				} ],
				[ 'Inline handler object', ( returned: any ) => ( { handle: jest.fn().mockReturnValue( returned ) } ) ],
				[ 'Inline handler function', ( returned: any ) => jest.fn().mockReturnValue( returned ) ],
			] )( '%s', ( _, setup ) => {
				it.each( asyncSamples )( 'should be %p for async injected handler return %p (by class)', async ( expected, returned ) => {
					addHandler( context.getHandler, setup( returned ) );
					await checkGuardResult( expected );
				} );
			} );
		} );
		describe( 'Handlers invocation', () => {
			it( 'should invoke injected handler (by class) properly', async () => {
				const mockAbility = {};
				abilityFactory.createFromRequest.mockResolvedValue( mockAbility );
				jest.spyOn( InjectableHandler.prototype, 'handle' ).mockReturnValue( true );
				addHandler( context.getHandler, InjectableHandler );
				await guard.canActivate( context );
				expect( InjectableHandler.prototype.handle ).toHaveBeenCalledTimes( 1 );
				expect( InjectableHandler.prototype.handle ).toHaveBeenCalledWith( mockAbility );
			} );
			it( 'should invoke injected handler (by string token) properly', async () => {
				const mockAbility = {};
				abilityFactory.createFromRequest.mockResolvedValue( mockAbility );
				module.get( providerString ).handle.mockReturnValue( true );
				addHandler( context.getHandler, providerString );
				await guard.canActivate( context );
				expect( module.get( providerString ).handle ).toHaveBeenCalledTimes( 1 );
				expect( module.get( providerString ).handle ).toHaveBeenCalledWith( mockAbility );
			} );
			it( 'should invoke injected handler (by symbol token) properly', async () => {
				const mockAbility = {};
				abilityFactory.createFromRequest.mockResolvedValue( mockAbility );
				module.get( providerSymbol ).handle.mockReturnValue( true );
				addHandler( context.getHandler, providerSymbol );
				await guard.canActivate( context );
				expect( module.get( providerSymbol ).handle ).toHaveBeenCalledTimes( 1 );
				expect( module.get( providerSymbol ).handle ).toHaveBeenCalledWith( mockAbility );
			} );
			it( 'should invoke inline handler properly', async () => {
				const mockAbility = {};
				abilityFactory.createFromRequest.mockResolvedValue( mockAbility );
				const mockHandler = { handle: jest.fn() };
				mockHandler.handle.mockReturnValue( true );
				addHandler( context.getHandler, mockHandler );
				await guard.canActivate( context );
				expect( mockHandler.handle ).toHaveBeenCalledTimes( 1 );
				expect( mockHandler.handle ).toHaveBeenCalledWith( mockAbility );
			} );
			it( 'should invoke inline handler function properly', async () => {
				const mockAbility = {};
				abilityFactory.createFromRequest.mockResolvedValue( mockAbility );
				const mockHandler = jest.fn();
				mockHandler.mockReturnValue( true );
				addHandler( context.getHandler, mockHandler );
				await guard.canActivate( context );
				expect( mockHandler ).toHaveBeenCalledTimes( 1 );
				expect( mockHandler ).toHaveBeenCalledWith( mockAbility );
			} );
			it( 'should check ability properly', async () => {
				const mockAbility = { can: jest.fn().mockReturnValue( true ) };
				abilityFactory.createFromRequest.mockResolvedValue( mockAbility );
				const mockHandler = { action: 'foo', subject: 'bar' };
				addHandler( context.getHandler, mockHandler );
				await guard.canActivate( context );
				expect( mockAbility.can ).toHaveBeenCalledTimes( 1 );
				expect( mockAbility.can ).toHaveBeenCalledWith( mockHandler.action, mockHandler.subject );
			} );
		} );
	} );
	describe( 'Multiple handlers', () => {
		it( 'should waterfall handlers', async () => {
			const mockAbility = { can: jest.fn().mockReturnValue( true ) };
			abilityFactory.createFromRequest.mockResolvedValue( mockAbility );
			const injectableSpy = jest.spyOn( InjectableHandler.prototype, 'handle' ).mockReturnValue( true );
			const inlineHandleObj = jest.fn().mockReturnValue( true );
			const inlineHandleFn = jest.fn().mockReturnValue( true );
			const providerStrSpy = module.get( providerString ).handle.mockReturnValue( true );
			const providerSymSpy = module.get( providerSymbol ).handle.mockReturnValue( true );

			const mockHandlers = [
				[ { action: 'foo', subject: 'bar' }, mockAbility.can ],
				[ jest.fn().mockReturnValue( true ) ],
				[ InjectableHandler, injectableSpy ],
				[ { handle: inlineHandleObj }, inlineHandleObj ],
				[ inlineHandleFn ],
				[ providerString, providerStrSpy ],
				[ providerSymSpy, providerSymSpy ],
			];
			mockHandlers.forEach( ( [ handler ] ) => {
				addHandler( context.getHandler, handler );
			} );
			await guard.canActivate( context );
			mockHandlers.forEach( ( [ handler, spy = handler ], i ) => {
				expect( spy ).toHaveBeenCalledTimes( 1 );
				if( i > 0 ){
					const [ prevHandler, prevSpy = prevHandler ] = mockHandlers[i - 1];
					expect( spy ).toHaveBeenCalledAfter( prevSpy );
				}
			} );
		} );
		it( 'should stop on first failing', async () => {
			const mockAbility = {};
			abilityFactory.createFromRequest.mockResolvedValue( mockAbility );
			const handlers = [
				jest.fn().mockReturnValue( true ),
				jest.fn().mockReturnValue( false ),
				jest.fn().mockReturnValue( true ),
			];
			handlers.forEach( handler => {
				addHandler( context.getHandler, handler );
			} );
			await expect( guard.canActivate( context ) ).toReject();
			expect( handlers[0] ).toHaveBeenCalledTimes( 1 );
			expect( handlers[1] ).toHaveBeenCalledTimes( 1 );
			expect( handlers[2] ).not.toHaveBeenCalled();
		} );
	} );
	describe( 'Rejection messages', () => {
		beforeEach( () => {
			jest.spyOn( InjectableHandler.prototype, 'handle' ).mockReturnValue( false );
		} );
		it.each( [
			[ 'Invalid authorizations: Endpoint statically forbidden', false ],
			[ 'Invalid authorizations: Failed condition', InjectableHandler ],
			[ 'Invalid authorizations: Failed condition', { handle: () => false } ],
			[ 'Invalid authorizations: Failed condition', () => false ],
			[ 'Invalid authorizations: Failed condition', providerSymbol ],
			[ 'Invalid authorizations: Failed condition', providerString ],
			[ 'Invalid authorizations: Can\'t "do" on "something"', { action: 'do', subject: 'something' } ],
		] )( 'should throw a ForbiddenException with message "%s" for %p', async ( message, handler ) => {
			const mockAbility = { can: jest.fn().mockReturnValue( false ) };
			abilityFactory.createFromRequest.mockResolvedValue( mockAbility );
			addHandler( context.getHandler, handler );
			await expect( guard.canActivate( context ) ).rejects.toThrowWithMessage( ForbiddenException, message );
		} );
	} );
} );
