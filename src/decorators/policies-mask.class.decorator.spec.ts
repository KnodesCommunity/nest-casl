/* eslint-disable @typescript-eslint/no-empty-function */
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
const { PolicyDecorator } = require( './policy.class-method.decorator' ) as ( jest.Mocked<typeof import( './policy.class-method.decorator' )> & {PolicyDecorator: jest.Mock} );

describe( 'PoliciesMask', () => {
	it( 'should apply policy on methods only', () => {
		@PoliciesMask( {} )
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
} );
