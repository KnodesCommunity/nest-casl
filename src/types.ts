import { Ability } from '@casl/ability';
import { CanActivate, Type } from '@nestjs/common';

import { MaybeAsyncValue } from './utils';

/**
 * A [CASL ability object](https://casl.js.org/v5/en/api/casl-ability#ability).
 *
 * For security purpose, it is expected that you **lock** the ability as soon as possible by removing any update function, like `update`.
 * Thus, this module expects abilities to be readonly.
 */
export type AnyAbilityLike = Pick<Ability<any, any>, 'can' | 'cannot'>

/**
 * This interface specify a class or object that can do dynamic and complex checks about the current user abilities.
 */
export interface IPolicy<TAbility extends AnyAbilityLike = AnyAbilityLike> {
	/**
	 * Check if the ability is allowed.
	 *
	 * @param ability - The request's ability.
	 * @returns `true` if allowed, `false` otherwise.
	 */
	handle( ability: TAbility ): MaybeAsyncValue<boolean>;
}

/**
 * A simple policy defined by an action and a subject.
 *
 * @see https://casl.js.org/v5/en/guide/intro#basics
 */
export type SimplePolicy<TAbility extends AnyAbilityLike> = TAbility extends Ability<infer TAbilityTuple> ?
	// Hack to force distribution of union
	// See https://stackoverflow.com/a/62085569/4839162
	TAbilityTuple extends any ? {action: TAbilityTuple[0]; subject: TAbilityTuple[1]} : never :
	{action: string; subject: string};

/**
 * Any type of policy that can be handled. It can either be
 * - an object or an **injectable** class implementing {@link IPolicy}
 * - a simple function that takes the ability and return a boolean
 * - a {@link SimplePolicy} defining the action and subject
 * - or a static boolean.
 *
 * Note that in some cases, static boolean are handled in a special way.
 *
 * @todo Docs page about special case.
 */
export type PolicyDescriptor<TAbility extends AnyAbilityLike> =
	| Type<IPolicy<TAbility>>
	| IPolicy<TAbility>
	| ( ( ability: TAbility ) => MaybeAsyncValue<boolean> )
	| SimplePolicy<TAbility>
	| boolean

/**
 * A dictionary of policies to apply on a class. All properties **must** be methods of the class it is applied on, **except** `*`.
 *
 * The `*` key is a special fallback case.
 *
 * @todo Docs page about special case.
 */
export type PolicyDescriptorMask<TAbility extends AnyAbilityLike> = Record<string, PolicyDescriptor<TAbility>>

/**
 * A list of guards or guard classes.
 */
export type GuardsList = Array<Array<CanActivate | Type<CanActivate>> | Type<CanActivate>>
