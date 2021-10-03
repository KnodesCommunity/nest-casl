import { PolicyDescriptor, PolicyDescriptorMask } from './types';

export const CHECK_POLICIES_KEY = Symbol( 'check_policy' );
export type PolicyMetadataDescriptor =
	| {type: 'policy'; policy: PolicyDescriptor<any>}
	| {type: 'policiesMask'; policy: PolicyDescriptorMask<any, any>}
