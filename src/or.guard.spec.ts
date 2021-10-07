import { CanActivate, Controller, ExecutionContext, Injectable, UseGuards } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { of, throwError } from 'rxjs';

import * as orGuardModule from './or.guard';
const { orGuard, mergeGuardResults } = orGuardModule;

describe( 'OrGuard', () => {
	describe( 'Multiple guards result merging', () => {
		const fakeGuards = ( returnValue: any[] ): Array<jest.Mocked<CanActivate>> => returnValue
			.map( r => typeof r === 'function' ?
				{ canActivate: jest.fn().mockImplementation( r ) } :
				{ canActivate: jest.fn().mockReturnValue( r ) } );
		const expectGuardsCalledInOrder = ( context: any, ...guards: Array<jest.Mocked<CanActivate>> ) => {
			guards.forEach( ( g, i ) => {
				expect( g.canActivate ).toHaveBeenCalledTimes( 1 );
				expect( g.canActivate ).toHaveBeenCalledWith( context );
				if( i > 0 ){
					expect( g.canActivate ).toHaveBeenCalledAfter( guards[i - 1].canActivate as any );
				}
			} );
		};

		describe( 'Check order', () => {
			const allFailingGuardsTypes = fakeGuards( [
				false, Promise.resolve( false ), of( false ),
				() => {throw new Error( 'Nope sync' );}, Promise.reject( new Error( 'Nope Promise' ) ), throwError( () => new Error( 'Nope Observable' ) ),
			] );
			it( 'should handle every output types', async () => {
				const context = {} as any;
				await mergeGuardResults( allFailingGuardsTypes, context );
				allFailingGuardsTypes.forEach( g => {
					expect( g.canActivate ).toHaveBeenCalledTimes( 1 );
				} );
			} );
			it( 'should waterfall properly', async () => {
				const context = {} as any;
				await mergeGuardResults( allFailingGuardsTypes, context );
				allFailingGuardsTypes.forEach( ( g, i ) => {
					if( i > 0 ){
						expect( g.canActivate ).toHaveBeenCalledAfter( allFailingGuardsTypes[i - 1].canActivate as any );
					}
				} );
			} );
		} );
		describe( 'All success', () => {
			it( 'should pass if 2 guards passes', async () => {
				const guards = fakeGuards( [ of( true ), of( true ) ] );
				const context = {} as any;
				await expect( mergeGuardResults( guards, context ) ).resolves.toEqual( true );
			} );
			it( 'should do correct calls in correct order', async () => {
				const guards = fakeGuards( [ of( true ), of( true ) ] );
				const context = {} as any;
				await mergeGuardResults( guards, context );
				expectGuardsCalledInOrder( context, guards[0] );
				expect( guards[1].canActivate ).not.toHaveBeenCalled();
			} );
		} );
		describe( 'Some success', () => {
			it( 'should pass if at least 1 guard pass', async () => {
				const guards = fakeGuards( [ of( false ), of( true ) ] );
				const context = {} as any;
				await expect( mergeGuardResults( guards, context ) ).resolves.toEqual( true );
			} );
			it( 'should do correct calls in correct order', async () => {
				const guards = fakeGuards( [ of( false ), of( true ), of( true ) ] );
				const context = {} as any;
				await expect( mergeGuardResults( guards, context ) ).resolves.toEqual( true );
				expectGuardsCalledInOrder( context, guards[0], guards[1] );
				expect( guards[2].canActivate ).not.toHaveBeenCalled();
			} );
		} );
		describe( 'All fail', () => {
			it( 'should fail with false if first guard returns false', async () => {
				const guards = fakeGuards( [ of( false ), of( false ) ] );
				const context = {} as any;
				await expect( mergeGuardResults( guards, context ) ).resolves.toEqual( false );
				expectGuardsCalledInOrder( context, guards[0], guards[1] );
			} );
			it( 'should fail with error if first guard throws', async () => {
				const error = new Error( 'Test error' );
				const guards = fakeGuards( [ throwError( () => error ), of( false ) ] );
				const context = {} as any;
				await expect( mergeGuardResults( guards, context ) ).rejects.toEqual( error );
				expectGuardsCalledInOrder( context, guards[0], guards[1] );
			} );
		} );
		describe( 'Invalid cases', () => {
			it( 'should throw if no guard passed', async () => {
				await expect( mergeGuardResults( [], {} as any ) ).rejects.toThrowWithMessage( TypeError, 'No first result' );
			} );
			it( 'should throw if CanActivate returns an invalid value', async () => {
				await expect( mergeGuardResults( [ { canActivate: jest.fn().mockReturnValue( { foo: 1 } ) } ], {} as any ) )
					.rejects.toThrowWithMessage( TypeError, 'Can\'t handle type of "canActivate" return "[object Object]" for guard Object' );
			} );
		} );
	} );
	describe( 'Dependencies resolution', () => {
		const mockMergeGuardResults = jest.fn<Promise<boolean>, [guards: readonly CanActivate[], context: ExecutionContext]>();
		beforeEach( async () => {
			jest.spyOn( orGuardModule, 'mergeGuardResults' ).mockImplementation( mockMergeGuardResults );
		} );

		it( 'should be able to inject OrGuard', async () => {
			const guardType = orGuard( [] );
			@Controller()
			@UseGuards( guardType )
			class TestController {}
			const module = await Test.createTestingModule( {
				controllers: [ TestController ],
			} ).compile();
			const guard = module.get( guardType );
			expect( guard ).toBeTruthy();
		} );
		it( 'should call mergeGuardResults correctly', async () => {
			@Injectable()
			class Provider1 implements CanActivate {
				public canActivate = jest.fn();
			}
			const inlineClass2 = { canActivate: jest.fn() };
			const provider3 = { provide: 'provider3', useValue: { canActivate: jest.fn() }};
			const provider4 = { provide: Symbol( 'provider4' ), useValue: { canActivate: jest.fn() }};

			const guardType = orGuard( [ Provider1, inlineClass2, provider3.provide, provider4.provide ] );
			@Controller()
			@UseGuards( guardType )
			class TestController {}
			const module = await Test.createTestingModule( {
				controllers: [ TestController ],
				providers: [ Provider1, provider3, provider4 ],
			} ).compile();
			const guard = module.get( guardType );
			mockMergeGuardResults.mockResolvedValue( true );
			const mockContext = {} as any;
			await expect( guard.canActivate( mockContext ) as any ).resolves.toEqual( true );
			expect( mockMergeGuardResults ).toHaveBeenCalledTimes( 1 );
			expect( mockMergeGuardResults ).toHaveBeenCalledWith( [ expect.any( Provider1 ), inlineClass2, provider3.useValue, provider4.useValue ], mockContext );
		} );
	} );
} );
