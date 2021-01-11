import { AnyAbility, PureAbility } from '@casl/ability';
import { DynamicModule, Module, Type } from '@nestjs/common';

import { CaslAbilityFactory } from './casl-ability.factory';
import { PoliciesGuard } from './policies.guard';

export interface ICaslRootConfig<TAbility extends AnyAbility = PureAbility> {
	abilityFactory: Type<CaslAbilityFactory<TAbility>>;
}

@Module( {} )
export class CaslModule {
	/**
	 * Configure the CaslModule using the provided configuration.
	 *
	 * @param config - The module configuration to use.
	 * @returns the configured CaslModule
	 */
	public static forRoot( config: ICaslRootConfig<any> ): DynamicModule {
		return {
			module: CaslModule,
			providers: [
				{ provide: CaslAbilityFactory, useClass: config.abilityFactory },
				PoliciesGuard,
			],
			exports: [
				CaslAbilityFactory,
				PoliciesGuard,
			],
		};
	}
}
