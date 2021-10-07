import 'reflect-metadata';

import { equals } from 'expect/build/jasmineUtils';

import { matcherHint, printReceived } from 'jest-matcher-utils';

const passMessage = ( received: any, calls: any ) => () =>
	`${matcherHint( '.not.toHaveBeenExactlyCalledLike', 'received', '' )
	}\n\n` +
`Expected function to have exactly been called like ${printReceived( calls )} but received:\n` +
`  ${printReceived( received )}`;

const failMessage = ( received: any, calls: any ) => () =>
	`${matcherHint( '.toHaveBeenExactlyCalledLike', 'received', '' )
	}\n\n` +
`Expected function to have exactly been called like ${printReceived( calls )} but received:\n` +
`  ${printReceived( received )}`;

expect.extend( {
	toHaveBeenExactlyCalledLike: <TArgs extends any[]>( fn: jest.Mock<any, TArgs>, ...expected: TArgs[] ) => {
		const pass = fn.mock.calls.length === expected.length && expected.every( ( c, i ) => equals( fn.mock.calls[i], c ) );
		if ( pass ) {
			return { pass: true, message: passMessage( fn.mock.calls, expected ) };
		}
		return { pass: false, message: failMessage( fn.mock.calls, expected ) };
	},
} );
