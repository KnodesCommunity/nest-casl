// From https://docs.nestjs.com/security/authorization
import { PureAbility } from '@casl/ability';
import { ExecutionContext } from '@nestjs/common';

import { AnyAbilityLike } from './types';

export const CaslAbilityFactory = Symbol( 'CaslAbilityFactory' );
export interface CaslAbilityFactory<TAbility extends AnyAbilityLike = PureAbility<any, any>> {
	/**
	 * Extract the ability from the HTTP request.
	 *
	 * @param request - The HTTP request, usually from express or fastify depending on your HTTP adapter.
	 * @returns the ability for the user.
	 */
	createFromRequest( request: unknown ): TAbility;
}

export const CaslAbilityAugmenter = Symbol( 'CaslAbilityFactoryAugmenter' );
export interface CaslAbilityAugmenter<TAbility extends AnyAbilityLike> {
	augment( ability: TAbility, context: ExecutionContext ): void;
}
