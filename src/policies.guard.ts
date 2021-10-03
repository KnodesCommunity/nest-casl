// From https://docs.nestjs.com/security/authorization
import { PureAbility } from '@casl/ability';
import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

import { CaslAbilityAugmenter, CaslAbilityFactory } from './casl-ability.factory';
import { CHECK_POLICIES_KEY, PolicyMetadataDescriptor } from './decorators/policies-key';
import { AnyAbilityLike, PolicyDescriptor, PolicyDescriptorMask } from './types';

const isNotNil = <T>( v: T | null | undefined ): v is T => v !== null && v !== undefined;

@Injectable()
export class PoliciesGuard<TAbility extends AnyAbilityLike = PureAbility<any, any>> implements CanActivate {
	public constructor(
		private readonly reflector: Reflector,
		@Inject( CaslAbilityFactory ) private readonly caslAbilityFactory: CaslAbilityFactory<TAbility>,
		@Optional() @Inject( CaslAbilityAugmenter ) private readonly augmenter: CaslAbilityAugmenter<any>,
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
			...this.getClassContextPolicies( context ),
			...this.getMethodContextPolicies( context ),
		];

		const request = context.switchToHttp().getRequest();
		const ability = this.caslAbilityFactory.createFromRequest( request );
		( request as any ).ability = ability;

		this.augmenter?.augment( ability, context );
		if( !policies.every( policy => this.execPolicyHandler( policy, ability ) ) ){
			throw new ForbiddenException( 'Invalid authorizations' );
		} else {
			return true;
		}
	}

	/**
	 * Extract the policies applied on the target class.
	 *
	 * @param context - The execution context.
	 * @returns an array of policies to apply for the target controller and method.
	 */
	private getClassContextPolicies( context: ExecutionContext ): Array<PolicyDescriptor<TAbility>>{
		const classPolicyHandlerDescriptors = this.reflector.get<PolicyMetadataDescriptor[]>( CHECK_POLICIES_KEY, context.getClass() ) || [];
		return classPolicyHandlerDescriptors.map( cphd => {
			switch( cphd.type ){
				case 'policiesMask': {
					const policy = cphd.policy as PolicyDescriptorMask<any, TAbility>;
					return policy[context.getHandler().name] ?? policy['*'];
				}

				case 'policy': {
					return cphd.policy as PolicyDescriptor<TAbility>;
				}

				default: {
					throw new TypeError( `Unsupported class policy handler of type ${( cphd as any ).type}` );
				}
			}
		} ).filter( isNotNil );
	}

	/**
	 * Extract the policies applied on the target handler.
	 *
	 * @param context - The execution context.
	 * @returns an array of policies to apply for the target handler.
	 */
	private getMethodContextPolicies( context: ExecutionContext ): Array<PolicyDescriptor<TAbility>>{
		const methodPolicyHandlerDescriptors = this.reflector.get<PolicyMetadataDescriptor[]>( CHECK_POLICIES_KEY, context.getHandler() ) || [];
		return methodPolicyHandlerDescriptors.map( mphd => {
			switch( mphd.type ){
				case 'policy': {
					return mphd.policy as PolicyDescriptor<TAbility>;
				}

				default: {
					throw new TypeError( `Unsupported method policy handler of type ${mphd.type}` );
				}
			}
		} ).filter( isNotNil );
	}

	/**
	 * Check if the policy matches the current request's ability.
	 *
	 * @param policy - The policy descriptor.
	 * @param ability - The request's ability.
	 * @returns `true` if allowed, `false` otherwise.
	 */
	private execPolicyHandler( policy: PolicyDescriptor<TAbility>, ability: TAbility ) {
		if( typeof policy === 'boolean' ) {
			return policy;
		} else if( typeof policy === 'function' ){
			return policy( ability );
		} else if( 'action' in policy && 'subject' in policy ){
			return ability.can( policy.action, policy.subject );
		} else if( 'handle' in policy ){
			return policy.handle( ability );
		} else {
			throw new Error();
		}
	}
}
