import { Type } from '@nestjs/common';
import { uniq } from 'lodash';

import { AnyAbilityLike, GuardsList, PolicyDescriptor, PolicyDescriptorMask } from '../types';
import { Policy } from './policy.class-method.decorator';
import { getProtoChainPropertiesNames, getProtoChainPropertyDescriptor } from './proto-utils';

export type PoliciesMask = {
	<TClass, TAbility extends AnyAbilityLike>( mask: PolicyDescriptorMask<TClass, TAbility> ): PoliciesMask.Described;
	usingGuard( ...guards: GuardsList ): PoliciesMask;
}
export namespace PoliciesMask {
	export type Described = ClassDecorator & {usingGuard: ( ...guards: GuardsList ) => Described};
}
const guardsList = Symbol( 'Guards list' );

/**
 * @param mask
 */
export function PoliciesMask<TClass, TAbility extends AnyAbilityLike>( mask: PolicyDescriptorMask<TClass, TAbility> ): PoliciesMask.Described {
	const described = ( ( target: Type<Omit<TClass, '*'>> ) => {
		const guards: GuardsList = Reflect.getMetadata( guardsList, described ) ?? [];
		const methods = getProtoChainPropertiesNames( target );
		const maskKeys = Object.keys( mask );
		const allMethodsToDecorate = uniq( [ ...methods, ...maskKeys ].filter( v => v !== '*' ) ) as any[];
		allMethodsToDecorate.forEach( method => {
			if( mask[method] !== true ) {
				const policyToApply: PolicyDescriptor<TAbility> = mask[method] ?? mask['*'] ?? { handle: () => true };
				Policy.usingGuard( ...guards )( policyToApply )( target, method, getProtoChainPropertyDescriptor( target, method ) );
			}
		} );
	} ) as PoliciesMask.Described;
	described.usingGuard = ( ...guards ) => {
		const oldGuardsList: GuardsList = Reflect.getMetadata( guardsList, described ) ?? [];
		const newPoliciesMask = PoliciesMask( mask );
		Reflect.defineMetadata( guardsList, guards.concat( oldGuardsList ), newPoliciesMask );
		return newPoliciesMask;
	};
	Reflect.defineMetadata( guardsList, ( this ? Reflect.getMetadata( guardsList,  this ) : null ) ?? [], described );
	return described;
}

PoliciesMask.usingGuard = function( ...guards: GuardsList ){
	const newPoliciesMaskThis = {};
	const newPoliciesMask = PoliciesMask.bind( newPoliciesMaskThis ) as PoliciesMask;
	newPoliciesMask.usingGuard = PoliciesMask.usingGuard.bind( newPoliciesMaskThis );
	const oldGuardsList: GuardsList = Reflect.getMetadata( guardsList, this ) ?? [];
	Reflect.defineMetadata( guardsList, oldGuardsList.concat( guards ), newPoliciesMaskThis );
	return newPoliciesMask;
};
