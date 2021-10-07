/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock( '@nestjs/common', () => {
	const applyDecoratorsRet = jest.fn();
	const UseGuardsRet = jest.fn();
	return {
		...jest.requireActual( '@nestjs/common' ),
		UseGuards: jest.fn().mockImplementation( g => {
			const inner = jest.fn().mockImplementation( UseGuardsRet );
			( inner as any ).UseGuards = g;
			return inner;
		} ),
		UseGuardsRet,
		applyDecorators: jest.fn().mockReturnValue( applyDecoratorsRet ),
		applyDecoratorsRet,
	};
} );
const { UseGuards, applyDecorators, applyDecoratorsRet, UseGuardsRet } = require( '@nestjs/common' ) as
	( jest.Mocked<typeof import( '@nestjs/common' )> & {applyDecoratorsRet: jest.Mock;UseGuardsRet: jest.Mock} );

jest.mock( '../or.guard', () => {
	const orGuardRet = {};
	return {
		orGuard: jest.fn().mockImplementation( gs => ( { guards: gs } ) ),
		orGuardRet,
	};
} );
const { orGuard } = require( '../or.guard' ) as
	( jest.Mocked<typeof import( '../or.guard' )> & {orGuardRet: jest.Mock} );

import { PoliciesGuard } from '../policies.guard';

import { Policy } from './policy.class-method.decorator';

beforeEach( () => jest.clearAllMocks() );
describe( 'Policy', () => {
	describe( 'Guards', () => {
		const guards = [ {}, {} ] as any[];
		describe( 'Static policies', () => {
			it( 'should not apply guards on "true"', () => {
				@Policy.usingGuard( guards[0] )( true )
				class Test {}
				expect( UseGuards ).not.toHaveBeenCalled();
				expect( UseGuardsRet ).not.toHaveBeenCalled();
				expect( applyDecorators ).not.toHaveBeenCalled();
				expect( applyDecoratorsRet ).not.toHaveBeenCalled();
			} );
			it( 'should apply only PoliciesGuard on "false"', () => {
				@Policy.usingGuard( guards[0] )( false )
				class Test {}
				expect( UseGuards ).toHaveBeenExactlyCalledLike( [ PoliciesGuard ] );
				expect( UseGuardsRet ).toHaveBeenExactlyCalledLike( [ Test ] );
			} );
		} );
		describe( 'Actual policies', () => {
			it( 'should apply decorators', () => {
				@Policy.usingGuard( guards[0] )( () => true ).usingGuard( guards[1] )
				class Test {}
				expect( UseGuardsRet ).not.toHaveBeenCalled();
				expect( applyDecorators ).toHaveBeenCalledTimes( 1 );
				expect( applyDecoratorsRet ).toHaveBeenExactlyCalledLike( [ Test ] );
			} );
			it( 'should apply at least the PoliciesGuard if no other guards are passed', () => {
				@Policy( () => true )
				class Test {}
				expect( UseGuards ).toHaveBeenExactlyCalledLike( [ PoliciesGuard ] );
				expect( UseGuardsRet ).not.toHaveBeenCalled();
				expect( applyDecorators ).toHaveBeenExactlyCalledLike( [ expect.objectContaining( { UseGuards: PoliciesGuard } ) ] );
			} );
			it( 'should apply other guards before the PoliciesGuard', () => {
				@Policy.usingGuard( guards[0] )( () => true ).usingGuard( guards[1] )
				class Test {}
				expect( UseGuards ).toHaveBeenExactlyCalledLike( [ guards[0] ], [ guards[1] ], [ PoliciesGuard ] );
				expect( UseGuardsRet ).not.toHaveBeenCalled();
				expect( applyDecorators ).toHaveBeenExactlyCalledLike( [
					expect.objectContaining( { UseGuards: guards[0] } ),
					expect.objectContaining( { UseGuards: guards[1] } ),
					expect.objectContaining( { UseGuards: PoliciesGuard } ),
				] );
			} );
			it( 'should merge array "usingGuards" in an "orGuard"', () => {
				@Policy.usingGuard( guards )( () => true )
				class Test {}
				expect( orGuard ).toHaveBeenExactlyCalledLike( [ guards ] );
				expect( UseGuards ).toHaveBeenExactlyCalledLike( [ orGuard.mock.results[0].value ], [ PoliciesGuard ] );
				expect( UseGuardsRet ).not.toHaveBeenCalled();
				expect( applyDecorators ).toHaveBeenExactlyCalledLike( [
					expect.objectContaining( { UseGuards: orGuard.mock.results[0].value } ),
					expect.objectContaining( { UseGuards: PoliciesGuard } ),
				] );
			} );
			it( 'should not merge array "usingGuards" in an "orGuard" if single element', () => {
				@Policy.usingGuard( [ guards[0] ] )( () => true )
				class Test {}
				expect( orGuard ).not.toHaveBeenCalled();
				expect( UseGuards ).toHaveBeenExactlyCalledLike( [ guards[0] ], [ PoliciesGuard ] );
				expect( UseGuardsRet ).not.toHaveBeenCalled();
				expect( applyDecorators ).toHaveBeenExactlyCalledLike( [
					expect.objectContaining( { UseGuards: guards[0] } ),
					expect.objectContaining( { UseGuards: PoliciesGuard } ),
				] );
			} );
		} );
	} );
	describe( 'Decorator calls', () => {
		describe( 'Method decorator', () => {
			it( 'should throw if no target', () => {
				expect( () => Policy( true )( null as any, 'foo', {} ) ).toThrowWithMessage( TypeError, 'Invalid bind on undefined#foo' );
			} );
			it( 'should throw if no descriptor', () => {
				expect( () => Policy( true )( { name: 'test' } as any, 'foo', null as any ) ).toThrowWithMessage( TypeError, 'Invalid bind on test#foo' );
			} );
			it( 'should throw if descriptor is not a function', () => {
				expect( () => Policy( true )( { name: 'test' } as any, 'foo', { value: 'Hello' } ) ).toThrowWithMessage( TypeError, 'test#foo is not a method' );
			} );
			it( 'should apply correctly', () => {
				const cls = {} as any;
				const desc = { value: () => true } as any;
				const policy = () => true;
				Policy( policy )( cls, 'foo', desc );
				expect( Reflect.getMetadataKeys( desc.value ) ).toHaveLength( 1 );
				const meta = Reflect.getMetadata( Reflect.getMetadataKeys( desc.value )[0], desc.value );
				expect( meta ).toHaveLength( 1 );
				expect( meta ).toEqual( [ policy ] );
			} );
		} );
		describe( 'Class decorator', () => {
			it( 'should apply correctly', () => {
				const cls = {} as any;
				const policy = () => true;
				Policy( policy )( cls );
				expect( Reflect.getMetadataKeys( cls ) ).toHaveLength( 1 );
				const meta = Reflect.getMetadata( Reflect.getMetadataKeys( cls )[0], cls );
				expect( meta ).toHaveLength( 1 );
				expect( meta ).toEqual( [ policy ] );
			} );
		} );
		describe( 'Other case of call', () => {
			it( 'should throw', () => {
				expect( () => ( Policy( true ) as any )( null, null ) ).toThrowWithMessage( RangeError, 'Invalid call arguments' );
			} );
		} );
	} );
} );
