import { Ability, AbilityTuple } from '@casl/ability';
import { CanActivate, Type } from '@nestjs/common';

export type AnyAbilityLike = Pick<Ability<any, any>, 'can' | 'cannot'>

export interface IPolicy<TAbility extends AnyAbilityLike> {
	/**
	 * Check if the ability is allowed.
	 *
	 * @param ability - The request's ability.
	 * @returns `true` if allowed, `false` otherwise.
	 */
	handle( ability: TAbility ): boolean;
}
type SimplePolicy<TAbility extends AnyAbilityLike> = TAbility extends Ability<AbilityTuple<infer TAction, infer TSubject>> ?
	{action: TAction; subject: TSubject} : {action: string; subject: string};

export type PolicyDescriptor<TAbility extends AnyAbilityLike> = IPolicy<TAbility> | ( ( ability: TAbility ) => boolean ) | boolean | SimplePolicy<TAbility>;

export type PolicyDescriptorMask<TClass, TAbility extends AnyAbilityLike> =
	Partial<{[k in keyof TClass]?: PolicyDescriptor<TAbility>} & {'*'?: PolicyDescriptor<TAbility>}>;

export type GuardsList = Array<Array<CanActivate | Type<CanActivate>> | Type<CanActivate>>
