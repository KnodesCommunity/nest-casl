import { Abilities, PureAbility } from '@casl/ability';
import { Test, TestingModule } from '@nestjs/testing';

import { CaslAbilityFactory } from './casl-ability.factory';

import { PoliciesGuard } from './policies.guard';

describe( 'PoliciesGuard', () => {
	let guard: PoliciesGuard;

	class MockCaslAbilityFactory implements CaslAbilityFactory<any> {
		public createFromRequest( _request: unknown ): PureAbility<Abilities, unknown> {
			throw new Error( 'Method not implemented.' );
		}
	}
	beforeEach( async () => {
		const module: TestingModule = await Test.createTestingModule( {
			providers: [
				PoliciesGuard,
				{ provide: CaslAbilityFactory, useClass: MockCaslAbilityFactory },
			],
		} ).compile();

		guard = module.get( PoliciesGuard );
	} );

	it( 'should be defined', () => {
		expect( guard ).toBeDefined();
	} );
} );
