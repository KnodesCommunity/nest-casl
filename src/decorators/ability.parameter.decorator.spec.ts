/* eslint-disable @typescript-eslint/no-empty-function */
jest.mock( '@casl/ability', () => ( {
	Ability: jest.fn(),
} ) );
import { Type } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { createFakeExecutionContext } from '../test-utils';
import { InjectAbility } from './ability.parameter.decorator';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const casl = require( '@casl/ability' ) as jest.Mocked<typeof import( '@casl/ability' )>;

describe( 'InjectAbility', () => {
	const getSingleParamDecorator = ( type: Type<any>, prop: string ) => {
		const metadata = Reflect.getMetadata( ROUTE_ARGS_METADATA, type, prop );
		const keys = Object.keys( metadata );
		expect( keys ).toHaveLength( 1 );
		return metadata[keys[0]];
	};
	it( 'should pass request ability', () => {
		class Target{
			public foo( @InjectAbility() _ability: any ){}
		}
		const paramDecorator = getSingleParamDecorator( Target, 'foo' );
		const { request, context } = createFakeExecutionContext();
		const ability = {};
		request.ability = ability;
		expect( paramDecorator.factory( paramDecorator.data, context ) ).toBe( ability );
	} );
	it( 'should throw an error by default if no request ability', () => {
		class Target{
			public foo( @InjectAbility() _ability: any ){}
		}
		const paramDecorator = getSingleParamDecorator( Target, 'foo' );
		const { context } = createFakeExecutionContext();
		expect( () => paramDecorator.factory( paramDecorator.data, context ) ).toThrowWithMessage( Error, 'Ability is required' );
	} );
	it( 'should create a new ability if no request ability and not required', () => {
		class Target{
			public foo( @InjectAbility( false ) _ability: any ){}
		}
		const paramDecorator = getSingleParamDecorator( Target, 'foo' );
		const { context } = createFakeExecutionContext();
		const ability = {};
		casl.Ability.mockReturnValue( ability as any );
		expect( paramDecorator.factory( paramDecorator.data, context ) ).toBe( ability );
		expect( casl.Ability ).toHaveBeenCalledTimes( 1 );
		expect( casl.Ability ).toHaveBeenCalledWith();
	} );
} );
