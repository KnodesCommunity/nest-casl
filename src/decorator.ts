// From https://docs.nestjs.com/security/authorization
import { AnyAbility } from '@casl/ability';
import { CustomDecorator, Type, UseGuards, applyDecorators } from '@nestjs/common';

import { CHECK_POLICIES_KEY, PolicyMetadataDescriptor } from './decorator-key';
import { PoliciesGuard } from './policies.guard';
import { PolicyDescriptor, PolicyDescriptorMask } from './types';

const addPolicyMetadata: <K extends PolicyMetadataDescriptor['type'], V extends PolicyDescriptor<any> | PolicyDescriptorMask<any, any> = any>(
	metadataKey: K,
	metadataValue: V
) => CustomDecorator<K> =
	<K extends PolicyMetadataDescriptor['type']>( metadataKey: K, metadataValue: any ): any =>
		( target: any ) => {
			const metadata: PolicyMetadataDescriptor[] = Reflect.getMetadata( CHECK_POLICIES_KEY, target ) ?? [];
			metadata.unshift( { type: metadataKey, policy: metadataValue } as PolicyMetadataDescriptor );
			Reflect.defineMetadata( CHECK_POLICIES_KEY, metadata, target );
		};

/**
 * Apply a simple policy on the given class or method.
 *
 * @param policyDescriptor - A descriptor of the policy to use.
 * @returns the function to decorate your class or method.
 */
export const Policy = <TAbility extends AnyAbility>( policyDescriptor: PolicyDescriptor<TAbility> ):
MethodDecorator & ClassDecorator =>
	applyDecorators(
		UseGuards( PoliciesGuard ),
		addPolicyMetadata( 'policy', policyDescriptor ),
	);

/**
 * Apply multiple policies on a class, as a dictionary. Policies are mapped on methods using the key name. The wildcard (`*`) matches all non-mapped methods.
 *
 * @example ```ts
 * @PoliciesMask({
 *   foo: true,
 *   bar: { action: Action.Update, subject: 'all' },
 *   '*': false,
 * })
 * class MyController {
 *   foo(){
 *     // executable by anyone
 *   }
 *   bar(){
 *     // executable only by users able to do `Action.Update` on subject `all`.
 *   }
 *   qux(){
 *     // executable by no one
 *   }
 * }
 * ```
 *
 * @param policyDescriptorMask - A dictionary of policy descriptors to use.
 * @returns the function to decorate your class.
 */
export const PoliciesMask = <TAbility extends AnyAbility, TClass>( policyDescriptorMask: PolicyDescriptorMask<TClass, TAbility> ):
( ( target: Type<Omit<TClass, '*'>> ) => ( Type<any> | void ) ) =>
	applyDecorators(
		UseGuards( PoliciesGuard ),
		addPolicyMetadata( 'policiesMask', policyDescriptorMask ),
	);
