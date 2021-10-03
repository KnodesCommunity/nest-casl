/* eslint-disable @typescript-eslint/no-empty-function */
import { getProtoChainPropertiesNames, getProtoChainPropertyDescriptor } from './proto-utils';

class Foo {
	public foo(){}
}
class Bar extends Foo {
	public bar(){}
}
class Baz extends Bar {
	public baz(){}
}
class Qux extends Baz {
	public qux(){}
}

describe( 'getProtoChainPropertyDescriptor', () => {
	it( 'should return method', () => {
		expect( getProtoChainPropertyDescriptor( Foo, 'foo' ) ).toBeTruthy();
	} );
	it( 'should return null if not found', () => {
		expect( getProtoChainPropertyDescriptor( Foo, 'nope' ) ).toBeNull();
	} );
	it( 'should return method of deep parent', () => {
		expect( getProtoChainPropertyDescriptor( Qux, 'foo' ) ).toBeTruthy();
	} );
} );

describe( 'getProtoChainPropertiesNames', () => {
	it.each( [
		{ ancestorsLabel: 'no ancestor', cls: Foo, names: [ 'foo' ] },
		{ ancestorsLabel: '1 ancestor', cls: Bar, names: [ 'foo', 'bar' ] },
		{ ancestorsLabel: '2 ancestors', cls: Baz, names: [ 'foo', 'bar', 'baz' ] },
		{ ancestorsLabel: '3 ancestors', cls: Qux, names: [ 'foo', 'bar', 'baz', 'qux' ] },
	] )( 'should get correct results with $ancestorsLabel', ( { cls, names } ) => {
		expect( getProtoChainPropertiesNames( cls ) ).toIncludeSameMembers( names );
	} );
} );
