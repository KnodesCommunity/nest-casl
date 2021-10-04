import { PoliciesMask, Policy } from './decorators';
import { AnyAbilityLike, GuardsList } from './types';

export type BoundPolicyDecorators<TAbility extends AnyAbilityLike = AnyAbilityLike> = {
	Policy: Policy<TAbility>;
	PoliciesMask: PoliciesMask<TAbility>;
	( ...guards: GuardsList ): BoundPolicyDecorators;
}

export const bindPolicyDecorators = <TAbility extends AnyAbilityLike = AnyAbilityLike>( ...guards: GuardsList ): BoundPolicyDecorators<TAbility> => {
	const bound = ( ( ...guardsIn ) => bindPolicyDecorators( ...guards, ...guardsIn ) ) as BoundPolicyDecorators;
	bound.Policy = Policy.usingGuard( ...guards );
	bound.PoliciesMask = PoliciesMask.usingGuard( ...guards );
	return bound;
};
