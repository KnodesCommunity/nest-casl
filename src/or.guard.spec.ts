import { CanActivate, Controller, ExecutionContext, Injectable, UseGuards } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { of, throwError } from 'rxjs';

import * as orGuardModule from './or.guard';
const { orGuard, mergeGuardResults } = orGuardModule;

describe( 'OrGuard', () => {
	describe( 'Multiple guards result merging', () => {
		describe( 'Check order', () => {
			it( 'should handle every output types', async () => {
				const guards = [
					{ canActivate: jest.fn().mockReturnValue( false ) },
					{ canActivate: jest.fn().mockResolvedValue( false ) },
					{ canActivate: jest.fn().mockReturnValue( of( false ) ) },
					{ canActivate: jest.fn().mockImplementation( () => {throw new Error( 'Nope sync' );} ) },
					{ canActivate: jest.fn().mockRejectedValue( new Error( 'Nope Promise' ) ) },
					{ canActivate: jest.fn().mockReturnValue( throwError( () => new Error( 'Nope Observable' ) ) ) },
				] as const;
				const context = {} as any;
				await mergeGuardResults( guards, context );
				guards.forEach( g => {
					expect( g.canActivate ).toHaveBeenCalledTimes( 1 );
				} );
			} );
			it( 'should waterfall properly', async () => {
				const guards = [
					{ canActivate: jest.fn().mockReturnValue( false ) },
					{ canActivate: jest.fn().mockResolvedValue( false ) },
					{ canActivate: jest.fn().mockReturnValue( of( false ) ) },
					{ canActivate: jest.fn().mockImplementation( () => {throw new Error( 'Nope sync' );} ) },
					{ canActivate: jest.fn().mockRejectedValue( new Error( 'Nope Promise' ) ) },
					{ canActivate: jest.fn().mockReturnValue( throwError( () => new Error( 'Nope Observable' ) ) ) },
				] as const;
				const context = {} as any;
				await mergeGuardResults( guards, context );
				guards.forEach( ( g, i ) => {
					if( i > 0 ){
						expect( g.canActivate ).toHaveBeenCalledAfter( guards[i - 1].canActivate );
					}
				} );
			} );
		} );
		describe( 'All success', () => {
			it( 'should pass if 2 guards passes', async () => {
				const guards = [
					{ canActivate: jest.fn().mockReturnValue( of( true ) ) },
					{ canActivate: jest.fn().mockReturnValue( of( true ) ) },
				] as const;
				const context = {} as any;
				await expect( mergeGuardResults( guards, context ) ).resolves.toEqual( true );
			} );
			it( 'should do correct calls in correct order', async () => {
				const guards = [
					{ canActivate: jest.fn().mockReturnValue( of( true ) ) },
					{ canActivate: jest.fn().mockReturnValue( of( true ) ) },
				] as const;
				const context = {} as any;
				await mergeGuardResults( guards, context );
				expect( guards[0].canActivate ).toHaveBeenCalledTimes( 1 );
				expect( guards[0].canActivate ).toHaveBeenCalledWith( context );
				expect( guards[1].canActivate ).not.toHaveBeenCalled();
			} );
		} );
		describe( 'Some success', () => {
			it( 'should pass if at least 1 guard pass', async () => {
				const guards = [
					{ canActivate: jest.fn().mockReturnValue( of( false ) ) },
					{ canActivate: jest.fn().mockReturnValue( of( true ) ) },
				] as const;
				const context = {} as any;
				await expect( mergeGuardResults( guards, context ) ).resolves.toEqual( true );
			} );
			it( 'should do correct calls in correct order', async () => {
				const guards = [
					{ canActivate: jest.fn().mockReturnValue( of( false ) ) },
					{ canActivate: jest.fn().mockReturnValue( of( true ) ) },
					{ canActivate: jest.fn().mockReturnValue( of( true ) ) },
				] as const;
				const context = {} as any;
				await expect( mergeGuardResults( guards, context ) ).resolves.toEqual( true );
				expect( guards[0].canActivate ).toHaveBeenCalledTimes( 1 );
				expect( guards[0].canActivate ).toHaveBeenCalledWith( context );
				expect( guards[1].canActivate ).toHaveBeenCalledTimes( 1 );
				expect( guards[1].canActivate ).toHaveBeenCalledWith( context );
				expect( guards[1].canActivate ).toHaveBeenCalledAfter( guards[0].canActivate );
				expect( guards[2].canActivate ).not.toHaveBeenCalled();
			} );
		} );
		describe( 'All fail', () => {
			it( 'should fail with false if first guard returns false', async () => {
				const guards = [
					{ canActivate: jest.fn().mockReturnValue( of( false ) ) },
					{ canActivate: jest.fn().mockReturnValue( of( false ) ) },
				] as const;
				const context = {} as any;
				await expect( mergeGuardResults( guards, context ) ).resolves.toEqual( false );
				expect( guards[0].canActivate ).toHaveBeenCalledTimes( 1 );
				expect( guards[0].canActivate ).toHaveBeenCalledWith( context );
				expect( guards[1].canActivate ).toHaveBeenCalledTimes( 1 );
				expect( guards[1].canActivate ).toHaveBeenCalledWith( context );
				expect( guards[1].canActivate ).toHaveBeenCalledAfter( guards[0].canActivate );
			} );
			it( 'should fail with error if first guard throws', async () => {
				const error = new Error( 'Test errpr' );
				const guards = [
					{ canActivate: jest.fn().mockReturnValue( throwError( () => error ) ) },
					{ canActivate: jest.fn().mockReturnValue( of( false ) ) },
				] as const;
				const context = {} as any;
				await expect( mergeGuardResults( guards, context ) ).rejects.toEqual( error );
				expect( guards[0].canActivate ).toHaveBeenCalledTimes( 1 );
				expect( guards[0].canActivate ).toHaveBeenCalledWith( context );
				expect( guards[1].canActivate ).toHaveBeenCalledTimes( 1 );
				expect( guards[1].canActivate ).toHaveBeenCalledWith( context );
				expect( guards[1].canActivate ).toHaveBeenCalledAfter( guards[0].canActivate );
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
