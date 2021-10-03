import { PureAbility } from '@casl/ability';
import { DynamicModule, Module, Type } from '@nestjs/common';

import { CaslAbilityFactory } from './casl-ability.factory';
import { PoliciesGuard } from './policies.guard';
import { AnyAbilityLike } from './types';

export interface ICaslRootConfig<TAbility extends AnyAbilityLike = PureAbility<any, any>> {
	abilityFactory: Type<CaslAbilityFactory<TAbility>>;
}

@Module( {
	providers: [
		PoliciesGuard,
	],
} )
export class CaslModule {
	/**
	 * Configure the CaslModule using the provided configuration.
	 *
	 * @param config - The module configuration to use.
	 * @returns the configured CaslModule
	 */
	public static withConfig( config: ICaslRootConfig<any> ): DynamicModule {
		return {
			module: CaslModule,
			providers: [
				{ provide: CaslAbilityFactory, useClass: config.abilityFactory },
			],
			exports: [
				CaslAbilityFactory,
			],
		};
	}
}
