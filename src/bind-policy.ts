import { PoliciesMask, Policy } from './decorators';
import { GuardsList } from './types';

export type BoundPolicy = {
	Policy: Policy;
	PoliciesMask: PoliciesMask;
	( ...guards: GuardsList ): BoundPolicy;
}

export const bindPolicy = ( ...guards: GuardsList ): BoundPolicy => {
	const bound = ( ( ...guardsIn ) => bindPolicy( ...guards, ...guardsIn ) ) as BoundPolicy;
	bound.Policy = Policy.usingGuard( ...guards );
	bound.PoliciesMask = PoliciesMask.usingGuard( ...guards );
	return bound;
};
