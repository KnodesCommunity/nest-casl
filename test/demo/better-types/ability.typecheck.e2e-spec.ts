import { expectTypeOf } from 'expect-type';

import { MyAbility } from './ability';

it( 'ability should have correct typings', () => {
	expectTypeOf<['read', 'PublicData']>().toMatchTypeOf<Parameters<MyAbility['can']>>();
	expectTypeOf<['create', 'PublicData']>().toMatchTypeOf<Parameters<MyAbility['can']>>();
	expectTypeOf<['admin', 'ImportantData']>().toMatchTypeOf<Parameters<MyAbility['can']>>();

	expectTypeOf<['admin', 'PublicData']>().not.toMatchTypeOf<Parameters<MyAbility['can']>>();
	expectTypeOf<['read', 'ImportantData']>().not.toMatchTypeOf<Parameters<MyAbility['can']>>();
} );
