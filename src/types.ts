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
 * A simple policy defined by an `action` and a `subject`.
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
 * __Booleans__ are handled in a special ways:
 * - If `true`, the policy guards are **never** ran. This could be used to expose a single anonymously accessible endpoint on a masked controller.
 * - If `false`, **only** the {@link PoliciesGuard} is ran, and throws a `ForbiddenException: Endpoint statically forbidden`.
 *
 * In all other cases, all guards are ran.
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
 * The `*` key is a fallback policy used when no more specific key matches. We __strongly__ recommend to use it with `false`, to explicitly allow endpoints.
 *
 * @see {@link PolicyDescriptor `PolicyDescriptor`}
 * @example
 * ```ts
 * @PoliciesMask({
 * 	'*': false, // Disallow by default
 * 	'create': { action: 'create', subject: 'Cat', },
 * 	'read': true, // Allow everybody to read. Don't even check any guard.
 * 	'update': { action: 'update', subject: 'Cat', },
 * 	'delete': { action: 'delete', subject: 'Cat', },
 * })
 * class CatsController {
 * 	public create(){}
 * 	public read(){}
 * 	public update(){}
 * 	public delete(){}
 * 	public admin(){} // Not specified in the mask, thus applying the `false` policy who always forbid access.
 * }
 * ```
 */
export type PolicyDescriptorMask<TAbility extends AnyAbilityLike> = Record<string, PolicyDescriptor<TAbility>>

/**
 * A list of guards or guard classes.
 * When called in a `usingGuard` method, they might be joined by a `or` condition.
 *
 * @example
 * ```ts
 * @Policy( () => true )
 * 	//          (Guard1 || Guard2)
 * 	.usingGuard([Guard1,   Guard2])
 * class Foo {}
 *
 * @PoliciesMask( { '*': () => true } )
 * 	//          (Guard3 || Guard4) && Guard5 && (Guard6)
 * 	.usingGuard([Guard3,   Guard4],   Guard5,   [Guard6])
 * class Bar {}
 */
export type GuardsList = Array<Array<CanActivate | Type<CanActivate>> | Type<CanActivate>>
