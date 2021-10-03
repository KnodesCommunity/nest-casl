import { UseGuards, applyDecorators } from '@nestjs/common';
import { isArray } from 'lodash';

import { PoliciesGuard } from '../policies.guard';
import { AnyAbilityLike, GuardsList, PolicyDescriptor } from '../types';
import { addPolicyMetadata, getProtoChainPropertyDescriptor } from './proto-utils';

export type Policy = {
	<TAbility extends AnyAbilityLike>( policy: PolicyDescriptor<TAbility> ): Policy.Described;
	usingGuard( ...guards: GuardsList ): Policy;
}
export namespace Policy {
	export type Described = MethodDecorator & ClassDecorator & {usingGuard: ( ...guards: GuardsList ) => Described};
}
const guardsList = Symbol( 'Guards list' );

/**
 * @param policy
 */
export function Policy<TAbility extends AnyAbilityLike>( policy: PolicyDescriptor<TAbility> ): Policy.Described {
	const described = ( ( ...args: Parameters<MethodDecorator | ClassDecorator> ) => {
		const guards: GuardsList = Reflect.getMetadata( guardsList, described ) ?? [];
		if( args.length === 3 ){
			const target = args[0];
			const method = args[1];
			args = [ target.constructor, method, getProtoChainPropertyDescriptor( target.constructor, method ) ];
			if( !args[0] || !args[2] ){
				throw new Error( 'Invalid bind !' );
			}
		} else if( args.length !== 1 ){
			throw new RangeError( 'Invalid call arguments' );
		}
		const fullDecorator = applyDecorators(
			...guards.map( g => UseGuards( ...( isArray( g ) ? g : [ g ] ) ) ),
			UseGuards( PoliciesGuard ),
			addPolicyMetadata( 'policy', policy ) );
		fullDecorator( ...args as [any] );
	} ) as Policy.Described;
	described.usingGuard = ( ...guards ) => {
		const oldGuardsList: GuardsList = Reflect.getMetadata( guardsList, described ) ?? [];
		const newPolicy = Policy( policy );
		Reflect.defineMetadata( guardsList, guards.concat( oldGuardsList ), newPolicy );
		return newPolicy;
	};
	Reflect.defineMetadata( guardsList, ( this ? Reflect.getMetadata( guardsList,  this ) : null ) ?? [], described );
	return described;
}

Policy.usingGuard = function( ...guards: GuardsList ){
	const newPolicyThis = {};
	const newPolicy = Policy.bind( newPolicyThis ) as Policy;
	newPolicy.usingGuard = Policy.usingGuard.bind( newPolicyThis );
	const oldGuardsList: GuardsList = Reflect.getMetadata( guardsList, this ) ?? [];
	Reflect.defineMetadata( guardsList, oldGuardsList.concat( guards ), newPolicyThis );
	return newPolicy;
};
