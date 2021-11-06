import { Type } from '@nestjs/common';
import { uniq, without } from 'lodash';

import { AnyAbilityLike, PolicyDescriptor } from '../types';

export const CHECK_POLICIES_KEY = Symbol( 'check_policy' );

export const addPolicyMetadata = <TAbility extends AnyAbilityLike>( metadataValue: PolicyDescriptor<TAbility> ): any =>
	( target: any ) => {
		const metadata: Array<PolicyDescriptor<TAbility>> = Reflect.getMetadata( CHECK_POLICIES_KEY, target ) ?? [];
		metadata.push( metadataValue );
		Reflect.defineMetadata( CHECK_POLICIES_KEY, metadata, target );
	};

// eslint-disable-next-line @typescript-eslint/ban-types -- No better type for generic ctor function
export const getProtoChainPropertyDescriptor = ( cls: Function, property: string | symbol ): PropertyDescriptor | null =>
	cls === Object || !cls?.prototype ?
		null :
		Object.getOwnPropertyDescriptor( cls.prototype, property ) ?? getProtoChainPropertyDescriptor( Object.getPrototypeOf( cls ), property );

const getProtoChainPropertiesNamesRec = ( cls: Type<any> ): string[] =>
	cls === Object || !cls?.prototype ?
		[] :
		Object.getOwnPropertyNames( cls.prototype ).concat( getProtoChainPropertiesNamesRec( Object.getPrototypeOf( cls ) ) );
export const getProtoChainPropertiesNames = ( cls: Type<any> ): string[] =>
	without( uniq( getProtoChainPropertiesNamesRec( cls ) ), ...Object.getOwnPropertyNames( Object.prototype ) );
