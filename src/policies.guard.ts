// From https://docs.nestjs.com/security/authorization
import { PureAbility } from '@casl/ability';
import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, Type } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

import { CaslAbilityFactory } from './casl-ability.factory';
import { CHECK_POLICIES_KEY } from './decorators/proto-utils';
import { AnyAbilityLike, PolicyDescriptor } from './types';

const SCOPE_OPTIONS_METADATA = ( () => {
	const fakeClass = {};
	Injectable()( fakeClass as any );
	const metaKeys = Reflect.getMetadataKeys( fakeClass );
	if( metaKeys.length !== 1 ){
		throw new Error( 'Your version of NestJS is incompatible with this package !' );
	}
	return metaKeys[0];
} )();

const isInjectable = ( fn: Type<any> | ( ( ...args: any[] ) => any ) ): fn is Type<any> => !!Reflect.getMetadata( SCOPE_OPTIONS_METADATA, fn );

@Injectable()
export class PoliciesGuard<TAbility extends AnyAbilityLike = PureAbility<any, any>> implements CanActivate {
	public constructor(
		private readonly _reflector: Reflector,
		@Inject( CaslAbilityFactory ) private readonly _caslAbilityFactory: CaslAbilityFactory<TAbility>,
		private readonly _moduleRef: ModuleRef,
	) {}

	/**
	 * Check if the current request can activate the desired controller.
	 *
	 * @param context - The execution context.
	 * @returns `true` if allowed, `false` otherwise.
	 */
	public canActivate(
		context: ExecutionContext,
	): boolean | Promise<boolean> | Observable<boolean> {
		const policies = [
			...this._getClassPolicies( context ),
			...this._getMethodPolicies( context ),
		];

		const request = context.switchToHttp().getRequest();
		const ability = this._caslAbilityFactory.createFromRequest( request );
		( request as any ).ability = ability;

		const failingPolicy = policies.find( policy => !this._execPolicyHandler( policy, ability ) );
		if( failingPolicy ){
			throw new ForbiddenException( `Invalid authorizations: ${this._getFailedPolicyMessage( failingPolicy )}` );
		} else {
			return true;
		}
	}

	/**
	 * Generate the message explaining why this policy failed.
	 *
	 * @param descriptor - The failing policy descriptor.
	 * @returns the explanation message.
	 */
	private _getFailedPolicyMessage( descriptor: PolicyDescriptor<TAbility> ): string {
		if( typeof descriptor === 'boolean' ) {
			return 'Endpoint statically forbidden';
		} else if( 'handle' in descriptor || typeof descriptor === 'function' ){
			return 'Failed condition';
		} else {
			return `Can't "${descriptor.action}" on "${descriptor.subject}"`;
		}
	}

	/**
	 * Extract the policies applied on the target class.
	 *
	 * @param context - The execution context.
	 * @returns an array of policies to apply for the target controller and method.
	 */
	private _getClassPolicies( context: ExecutionContext ): Array<PolicyDescriptor<TAbility>>{
		return this._reflector.get<Array<PolicyDescriptor<TAbility>>>( CHECK_POLICIES_KEY, context.getClass() ) || [];
	}

	/**
	 * Extract the policies applied on the target handler.
	 *
	 * @param context - The execution context.
	 * @returns an array of policies to apply for the target handler.
	 */
	private _getMethodPolicies( context: ExecutionContext ): Array<PolicyDescriptor<TAbility>>{
		return this._reflector.get<Array<PolicyDescriptor<TAbility>>>( CHECK_POLICIES_KEY, context.getHandler() ) || [];
	}

	/**
	 * Check if the policy matches the current request's ability.
	 *
	 * @param policy - The policy descriptor.
	 * @param ability - The request's ability.
	 * @returns `true` if allowed, `false` otherwise.
	 */
	private _execPolicyHandler( policy: PolicyDescriptor<TAbility>, ability: TAbility ) {
		if( typeof policy === 'boolean' ) {
			return policy;
		} else if( typeof policy === 'function' ){
			if( isInjectable( policy ) ){
				return this._moduleRef.get( policy ).handle( ability );
			} else {
				return policy( ability );
			}
		} else if( 'action' in policy && 'subject' in policy ){
			return ability.can( policy.action, policy.subject );
		} else if( 'handle' in policy ){
			return policy.handle( ability );
		} else {
			throw new Error();
		}
	}
}
