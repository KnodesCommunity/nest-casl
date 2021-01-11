// From https://docs.nestjs.com/security/authorization
import { AnyAbility, PureAbility } from '@casl/ability';

export const CaslAbilityFactory = Symbol( 'CaslAbilityFactory' );
export interface CaslAbilityFactory<TAbility extends AnyAbility = PureAbility> {
	/**
	 * Extract the ability from the HTTP request.
	 *
	 * @param request - The HTTP request, usually from express or fastify depending on your HTTP adapter.
	 * @returns the ability for the user.
	 */
	createFromRequest( request: unknown ): TAbility;
}
