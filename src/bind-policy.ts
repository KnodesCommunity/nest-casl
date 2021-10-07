import { PoliciesMask, Policy } from './decorators';
import { AnyAbilityLike, GuardsList } from './types';

/**
 * A couple of {@link Policy `Policy`} & {@link PoliciesMask `PoliciesMask`} decorators using predefined guards.
 * You may call again this object to append more guards.
 */
export type BoundPolicyDecorators<TAbility extends AnyAbilityLike = AnyAbilityLike> = {
	Policy: Policy<TAbility>;
	PoliciesMask: PoliciesMask<TAbility>;
	( ...guards: GuardsList ): BoundPolicyDecorators<TAbility>;
}

/**
 * Prepare a new couple of {@link Policy `Policy`} & {@link PoliciesMask `PoliciesMask`} decorators bound to use the given {@link guards}.
 *
 * @example
 * ```ts
 * const ViaJwt = bindPolicyDecorators( AuthGuard( 'jwt' ));
 * const ViaStrongJwt = ViaJwt( AuthenticatedStrongly );
 * ```
 * @param guards - A list of guards to use.
 * @returns an function with properties containing the new decorators. You may call again this function to add more guards.
 */
export const bindPolicyDecorators = <TAbility extends AnyAbilityLike = AnyAbilityLike>( ...guards: GuardsList ): BoundPolicyDecorators<TAbility> => {
	const bound = ( ( ...guardsIn ) => bindPolicyDecorators( ...guards, ...guardsIn ) ) as BoundPolicyDecorators<TAbility>;
	bound.Policy = Policy.usingGuard( ...guards );
	bound.PoliciesMask = PoliciesMask.usingGuard( ...guards );
	return bound;
};
