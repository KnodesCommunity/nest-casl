// From https://docs.nestjs.com/security/authorization
import { PureAbility } from '@casl/ability';

import { AnyAbilityLike } from './types';
import { MaybeAsyncValue } from './utils';

/**
 * @ignore
 */
export const CaslAbilityFactory = Symbol( 'CaslAbilityFactory' );

/**
 * A class interface that generate the CASL ability from the request.
 */
export interface CaslAbilityFactory<TAbility extends AnyAbilityLike = PureAbility<any, any>> {
	/**
	 * Extract the ability from the HTTP request.
	 *
	 * @param request - The HTTP request, usually from express or fastify depending on your HTTP adapter.
	 * @returns the ability for the user.
	 */
	createFromRequest( request: unknown ): MaybeAsyncValue<TAbility>;
}
