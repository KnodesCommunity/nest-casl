/* eslint-disable @typescript-eslint/no-empty-function */
import { Type } from '@nestjs/common';

import { PoliciesMask } from './policies-mask.class.decorator';

jest.mock( './policy.class-method.decorator', () => {
	const PolicyDecorator = jest.fn();
	const Policy = jest.fn().mockReturnValue( PolicyDecorator );
	( Policy as any ).usingGuard = jest.fn().mockReturnValue( Policy );
	return {
		PolicyDecorator,
		Policy,
	};
} );
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PolicyDecorator, Policy } = require( './policy.class-method.decorator' ) as ( jest.Mocked<typeof import( './policy.class-method.decorator' )> & {PolicyDecorator: jest.Mock} );

beforeEach( () => jest.clearAllMocks() );
describe( 'PoliciesMask', () => {
	it( 'should apply policy on methods only', () => {
		@PoliciesMask( {
			'*': () => true,
		} )
		class Foo {
			public bar() {}
			public baz() {}
			public get qux(){
				return true;
			}
		}

		expect( PolicyDecorator ).not.toHaveBeenCalledWith( Foo, 'qux', expect.anything() );
		expect( PolicyDecorator ).toHaveBeenCalledWith( Foo, 'bar', expect.anything() );
		expect( PolicyDecorator ).toHaveBeenCalledWith( Foo, 'baz', expect.anything() );
		expect( PolicyDecorator ).toHaveBeenCalledTimes( 2 );
	} );
	it( 'should apply policy on inherited methods', () => {
		class Foo {
			public foo() {}
		}
		@PoliciesMask( {
			'*': () => true,
		} )
		class Bar extends Foo {
			public bar() {}
		}

		expect( PolicyDecorator ).toHaveBeenCalledWith( Bar, 'foo', expect.anything() );
		expect( PolicyDecorator ).toHaveBeenCalledWith( Bar, 'bar', expect.anything() );
		expect( PolicyDecorator ).toHaveBeenCalledTimes( 2 );
	} );
	describe( 'PolicyDecorator application', () => {
		const fakePolicy = () => true;
		const expectCorrectSinglePolicyCall = ( guards: any[], policy: any, cls: Type<any>, prop: string ) => {
			expect( PolicyDecorator ).toHaveBeenExactlyCalledLike( [ cls, prop, expect.anything() ] );
			expect( Policy ).toHaveBeenExactlyCalledLike( [ policy ] );
			expect( Policy.usingGuard ).toHaveBeenExactlyCalledLike( [ ...guards ] );
		};
		describe( 'Without guards', () => {
			it( 'should use explicit policy if set', () => {
				@PoliciesMask( { foo: fakePolicy } )
				class Foo {
					public foo() {}
				}
				expectCorrectSinglePolicyCall( [], fakePolicy, Foo, 'foo' );
			} );
			it( 'should fallback to * prop', () => {
				@PoliciesMask( { '*': fakePolicy } )
				class Foo {
					public foo() {}
				}
				expectCorrectSinglePolicyCall( [], fakePolicy, Foo, 'foo' );
			} );
			it( 'should use a default function returning "true" if no mask', () => {
				@PoliciesMask( {} )
				class Foo {
					public foo() {}
				}
				expectCorrectSinglePolicyCall(
					[],
					expect.toSatisfy( fn => typeof fn === 'function' && fn() === true ),
					Foo, 'foo' );
			} );
		} );
		describe( 'Guards', () => {
			const guards = [ {}, {} ] as any[];
			it( 'should pass guards correctly (single suffix)', () => {
				@PoliciesMask( { '*': fakePolicy } )
					.usingGuard( guards[0] )
				class Foo {
					public foo() {}
				}
				expectCorrectSinglePolicyCall( [ guards[0] ], fakePolicy, Foo, 'foo' );
			} );
			it( 'should pass guards correctly (double suffix)', () => {
				@PoliciesMask( { '*': fakePolicy } )
					.usingGuard( guards[0] )
					.usingGuard( guards[1] )
				class Foo {
					public foo() {}
				}
				expectCorrectSinglePolicyCall( [ guards[0], guards[1] ], fakePolicy, Foo, 'foo' );
			} );
			it( 'should pass guards correctly (single prefix)', () => {
				@PoliciesMask.usingGuard( guards[0] )( { '*': fakePolicy } )
				class Foo {
					public foo() {}
				}
				expectCorrectSinglePolicyCall( [ guards[0] ], fakePolicy, Foo, 'foo' );
			} );
			it( 'should pass guards correctly (double prefix)', () => {
				@PoliciesMask.usingGuard( guards[0] ).usingGuard( guards[1] )( { '*': fakePolicy } )
				class Foo {
					public foo() {}
				}
				expectCorrectSinglePolicyCall( [ guards[0], guards[1] ], fakePolicy, Foo, 'foo' );
			} );
			it( 'should pass guards correctly (prefix & suffix)', () => {
				@PoliciesMask.usingGuard( guards[0] )( { '*': fakePolicy } ).usingGuard( guards[1] )
				class Foo {
					public foo() {}
				}
				expectCorrectSinglePolicyCall( [ guards[0], guards[1] ], fakePolicy, Foo, 'foo' );
			} );
		} );
	} );
} );
