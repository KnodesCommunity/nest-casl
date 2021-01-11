import { Ability, AbilityTuple, AnyAbility } from '@casl/ability';

export interface IPolicy<TAbility extends AnyAbility> {
	/**
	 * Check if the ability is allowed.
	 *
	 * @param ability - The request's ability.
	 * @returns `true` if allowed, `false` otherwise.
	 */
	handle( ability: TAbility ): boolean;
}
type SimplePolicy<TAbility extends AnyAbility> = TAbility extends Ability<AbilityTuple<infer TAction, infer TSubject>> ?
	{action: TAction; subject: TSubject} : never;

export type PolicyDescriptor<TAbility extends AnyAbility> = IPolicy<TAbility> | ( ( ability: TAbility ) => boolean ) | boolean | SimplePolicy<TAbility>;

export type PolicyDescriptorMask<TClass, TAbility extends AnyAbility> =
	Partial<{[k in keyof TClass]?: PolicyDescriptor<TAbility>} & {'*'?: PolicyDescriptor<TAbility>}>;
