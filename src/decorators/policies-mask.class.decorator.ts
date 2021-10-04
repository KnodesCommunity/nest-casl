import { Type } from '@nestjs/common';
import { uniq } from 'lodash';

import { AnyAbilityLike, GuardsList, PolicyDescriptor, PolicyDescriptorMask } from '../types';
import { Policy } from './policy.class-method.decorator';
import { getProtoChainPropertiesNames, getProtoChainPropertyDescriptor } from './proto-utils';

type PolicyDescriptorMaskedClass<TMask extends PolicyDescriptorMask<any>, TClass> =
	Type<{[k in Exclude<keyof TMask, '*'>]: ( ...args: any[] ) => any;}> & TClass;

/**
 * @see {@link PoliciesMask}
 * @ignore
 */
export type PoliciesMask<TAbility extends AnyAbilityLike> = {
	/**
	 * @see {@link PoliciesMask}
	 */
	<TMask extends Record<string, PolicyDescriptor<TAbility>>>( mask: TMask ): BoundPoliciesMask<TMask, TAbility>;
	/**
	 * @see {@link PoliciesMask.usingGuard}
	 */
	usingGuard( ...guards: GuardsList ): PoliciesMask<TAbility>;
}

/**
 * A policies mask class decorator ready to be applied. You may add new guards using {@link BoundPolicy.usingGuard}.
 */
type BoundPoliciesMask<TMask extends PolicyDescriptorMask<TAbility>, TAbility extends AnyAbilityLike> =
	& ( <TClass>( target: PolicyDescriptorMaskedClass<TMask, TClass> ) => PolicyDescriptorMaskedClass<TMask, TClass> | void )
	& {
		/**
		 * Add more {@link guards} to run before checking.
		 *
		 * @returns the decorator with the same mask.
		 */
		usingGuard: ( ...guards: GuardsList ) => BoundPoliciesMask<TMask, TAbility>;
	};
const guardsList = Symbol( 'Guards list' );

/**
 * A class decorator factory that you can call by passing a {@link PolicyDescriptorMask}.
 * You can also call {@link PoliciesMask.usingGuard} to create a new {@link PoliciesMask} decorator that will always apply the given guards before checking.
 *
 * @category Decorators
 * @param this - Context. Not a parameter.
 * @param mask - A mask of policy descriptors.
 * @returns a class decorator.
 */
export function PoliciesMask<TMask extends PolicyDescriptorMask<TAbility>, TAbility extends AnyAbilityLike>( this: unknown, mask: TMask ): BoundPoliciesMask<TMask, TAbility> {
	const described = ( <TClass>( target: PolicyDescriptorMaskedClass<TMask, TClass> ) => {
		const guards: GuardsList = Reflect.getMetadata( guardsList, described ) ?? [];
		const methods = getProtoChainPropertiesNames( target ).filter( p => typeof target.prototype[p] === 'function' );
		const maskKeys = Object.keys( mask );
		const allMethodsToDecorate = uniq( [ ...methods, ...maskKeys ].filter( v => v !== '*' ) ) as any[];
		allMethodsToDecorate.forEach( method => {
			if( mask[method] !== true ) {
				const policyToApply: PolicyDescriptor<TAbility> = mask[method] ?? mask['*'] ?? { handle: () => true };
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- This is asserted in {@link Policy}.
				Policy.usingGuard( ...guards )( policyToApply )( target, method, getProtoChainPropertyDescriptor( target, method )! );
			}
		} );
	} ) as BoundPoliciesMask<TMask, TAbility>;
	described.usingGuard = ( ...guards ) => {
		const oldGuardsList: GuardsList = Reflect.getMetadata( guardsList, described ) ?? [];
		const newPoliciesMask = PoliciesMask<TMask, TAbility>( mask );
		Reflect.defineMetadata( guardsList, oldGuardsList.concat( guards ), newPoliciesMask );
		return newPoliciesMask;
	};
	Reflect.defineMetadata( guardsList, ( this ? Reflect.getMetadata( guardsList,  this as any ) : null ) ?? [], described );
	return described;
}

/**
 * Create a new {@link PoliciesMask} decorator factory that will always use the given {@link guards} before checking.
 *
 * @param guards - The list of guards to use.
 * @returns a new {@link PoliciesMask} decorator factory.
 */
PoliciesMask.usingGuard = function usingGuard( ...guards: GuardsList ){
	const newPoliciesMaskThis = {};
	const newPoliciesMask = PoliciesMask.bind( newPoliciesMaskThis ) as PoliciesMask<AnyAbilityLike>;
	newPoliciesMask.usingGuard = PoliciesMask.usingGuard.bind( newPoliciesMaskThis );
	const oldGuardsList: GuardsList = Reflect.getMetadata( guardsList, this ) ?? [];
	Reflect.defineMetadata( guardsList, oldGuardsList.concat( guards ), newPoliciesMaskThis );
	return newPoliciesMask;
};
