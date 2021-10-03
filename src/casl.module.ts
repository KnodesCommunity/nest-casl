import { PureAbility } from '@casl/ability';
import { DynamicModule, Module, Type } from '@nestjs/common';

import { CaslAbilityAugmenter, CaslAbilityFactory } from './casl-ability.factory';
import { PoliciesGuard } from './policies.guard';
import { AnyAbilityLike } from './types';

export interface ICaslRootConfig<TAbility extends AnyAbilityLike = PureAbility<any, any>> {
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

	/**
	 * @param augmenter
	 */
	public static withAugmenter( augmenter: Type<CaslAbilityAugmenter<any>> ): DynamicModule {
		return {
			module: CaslModule,
			providers: [
				{ provide: CaslAbilityAugmenter, useClass: augmenter },
			],
		};
	}
}
