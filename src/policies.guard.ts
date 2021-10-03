// From https://docs.nestjs.com/security/authorization
import { PureAbility } from '@casl/ability';
import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

import { CaslAbilityFactory } from './casl-ability.factory';
import { CHECK_POLICIES_KEY } from './policies-key';
import { AnyAbilityLike, PolicyDescriptor } from './types';

@Injectable()
export class PoliciesGuard<TAbility extends AnyAbilityLike = PureAbility<any, any>> implements CanActivate {
	public constructor(
		private readonly reflector: Reflector,
		@Inject( CaslAbilityFactory ) private readonly caslAbilityFactory: CaslAbilityFactory<TAbility>,
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
		const ability = this.caslAbilityFactory.createFromRequest( request );
		( request as any ).ability = ability;

		if( !policies.every( policy => this._execPolicyHandler( policy, ability ) ) ){
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
	private _getClassPolicies( context: ExecutionContext ): Array<PolicyDescriptor<TAbility>>{
		return this.reflector.get<Array<PolicyDescriptor<TAbility>>>( CHECK_POLICIES_KEY, context.getClass() ) || [];
	}

	/**
	 * Extract the policies applied on the target handler.
	 *
	 * @param context - The execution context.
	 * @returns an array of policies to apply for the target handler.
	 */
	private _getMethodPolicies( context: ExecutionContext ): Array<PolicyDescriptor<TAbility>>{
		return this.reflector.get<Array<PolicyDescriptor<TAbility>>>( CHECK_POLICIES_KEY, context.getHandler() ) || [];
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
