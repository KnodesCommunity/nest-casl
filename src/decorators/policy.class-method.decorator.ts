import { UseGuards, applyDecorators } from '@nestjs/common';
import { isArray } from 'lodash';

import { orGuard } from '../or.guard';
import { PoliciesGuard } from '../policies.guard';
import { AnyAbilityLike, GuardsList, PolicyDescriptor } from '../types';
import { addPolicyMetadata } from './proto-utils';

/**
 * @see {@link Policy}
 * @ignore
 */
export type Policy<TAbility extends AnyAbilityLike> = {
	/**
	 * @see {@link Policy}
	 */
	( policy: PolicyDescriptor<TAbility> ): BoundPolicy<TAbility>;
	/**
	 * @see {@link Policy.usingGuard}
	 */
	usingGuard( ...guards: GuardsList ): Policy<TAbility>;
}

/**
 * A policy method or class decorator ready to be applied. You may add new guards using {@link BoundPolicy.usingGuard}.
 */
type BoundPolicy<TAbility extends AnyAbilityLike> =
	& MethodDecorator
	& ClassDecorator
	& {
		/**
		 * Add more {@link guards} to run before checking.
		 *
		 * @returns the decorator with the same ability.
		 */
		usingGuard: ( ...guards: GuardsList ) => BoundPolicy<TAbility>;
	};
const guardsList = Symbol( 'Guards list' );

/**
 * A method & class decorator factory that you can call by passing a {@link PolicyDescriptor}.
 * You can also call {@link Policy.usingGuard} to create a new {@link Policy} decorator that will always apply the given guards before checking.
 *
 * @category Decorators
 * @param policy - The policy descriptor.
 * @returns a method or class decorator.
 */
export function Policy<TAbility extends AnyAbilityLike>( policy: PolicyDescriptor<TAbility> ): BoundPolicy<TAbility> {
	const described = ( ( ...args: Parameters<MethodDecorator | ClassDecorator> ) => {
		const guards: GuardsList = Reflect.getMetadata( guardsList, described ) ?? [];
		if( args.length === 3 ){
			const propLabel = `${String( ( args[0] as any ).name )}#${String( args[1] )}`;
			if( !args[0] || !args[2] ){
				throw new Error( `Invalid bind on ${propLabel}` );
			} else if( typeof args[2].value !== 'function' ){
				throw new Error( `${propLabel} is not a method` );
			}
			addPolicyMetadata( policy )( args[2].value );
		} else if( args.length === 1 ){
			addPolicyMetadata( policy )( args[0] );
		} else {
			throw new RangeError( 'Invalid call arguments' );
		}
		const guardsDecorators = guards.map( g => UseGuards( ...( isArray( g ) ?
			g.length > 1 ?
				[ orGuard( g ) ] :
				g :
			[ g ] ) ) );
		const fullDecorator = applyDecorators(
			...guardsDecorators,
			UseGuards( PoliciesGuard ) );
		fullDecorator( ...args as [any] );
	} ) as BoundPolicy<TAbility>;
	described.usingGuard = ( ...guards ) => {
		const oldGuardsList: GuardsList = Reflect.getMetadata( guardsList, described ) ?? [];
		const newPolicy = Policy( policy );
		Reflect.defineMetadata( guardsList, oldGuardsList.concat( guards ), newPolicy );
		return newPolicy;
	};
	Reflect.defineMetadata( guardsList, ( this ? Reflect.getMetadata( guardsList,  this ) : null ) ?? [], described );
	return described;
}

/**
 * Create a new {@link Policy} decorator factory that will always use the given {@link guards} before checking.
 *
 * @param guards - The list of guards to use.
 * @returns a new {@link Policy} decorator factory.
 */
Policy.usingGuard = function usingGuard( ...guards: GuardsList ){
	const newPolicyThis = {};
	const newPolicy = Policy.bind( newPolicyThis ) as typeof Policy;
	newPolicy.usingGuard = Policy.usingGuard.bind( newPolicyThis );
	const oldGuardsList: GuardsList = Reflect.getMetadata( guardsList, this ) ?? [];
	Reflect.defineMetadata( guardsList, oldGuardsList.concat( guards ), newPolicyThis );
	return newPolicy;
};
