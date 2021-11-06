// From https://docs.nestjs.com/security/authorization
import { PureAbility } from '@casl/ability';
import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';

import { CaslAbilityFactory } from './casl-ability.factory';
import { CHECK_POLICIES_KEY } from './decorators/proto-utils';
import { AnyAbilityLike, PolicyDescriptor } from './types';
import { anyToPromise, isInjectable } from './utils';

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
	public async canActivate(
		context: ExecutionContext,
	): Promise<boolean> {
		const policies: Array<PolicyDescriptor<TAbility>> = [
			...this._getPolicies( context.getClass() ),
			...this._getPolicies( context.getHandler() ),
		];

		const request = context.switchToHttp().getRequest();
		const ability = await anyToPromise( () => this._caslAbilityFactory.createFromRequest( request ) );
		( request as any ).ability = ability;

		for( const policy of policies ){
			const ret = await anyToPromise( () => this._execPolicyHandler( policy, ability ) );
			if( !ret ){
				throw new ForbiddenException( `Invalid authorizations: ${this._getFailedPolicyMessage( policy )}` );
			}
		}
		return true;
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
		} else if( typeof descriptor === 'string' || typeof descriptor === 'symbol' || 'handle' in descriptor || typeof descriptor === 'function' ){
			return 'Failed condition';
		} else {
			return `Can't "${descriptor.action}" on "${descriptor.subject}"`;
		}
	}

	/**
	 * Extract the policies applied on the target.
	 *
	 * @param target - The target.
	 * @returns an array of policies to apply.
	 */
	private _getPolicies( target: any ): Array<PolicyDescriptor<TAbility>>{
		return this._reflector.get<Array<PolicyDescriptor<TAbility>>>( CHECK_POLICIES_KEY, target ) || [];
	}

	/**
	 * Check if the policy matches the current request's ability.
	 *
	 * @param policy - The policy descriptor.
	 * @param ability - The request's ability.
	 * @returns `true` if allowed, `false` otherwise.
	 */
	private _execPolicyHandler( policy: PolicyDescriptor<TAbility>, ability: TAbility ) {
		const injectedPolicy = ( typeof policy === 'function' && isInjectable( policy ) ) || typeof policy === 'string' || typeof policy === 'symbol' ?
			this._moduleRef.get( policy ) :
			policy;
		if( typeof injectedPolicy === 'boolean' ) {
			return injectedPolicy;
		} else if( typeof injectedPolicy === 'function' ){
			return injectedPolicy( ability );
		} else if( injectedPolicy && 'action' in injectedPolicy && 'subject' in injectedPolicy ){
			return ability.can( injectedPolicy.action, injectedPolicy.subject );
		} else if( injectedPolicy && 'handle' in injectedPolicy ){
			return injectedPolicy.handle( ability );
		} else {
			throw new TypeError( 'Invalid handler type' );
		}
	}
}
