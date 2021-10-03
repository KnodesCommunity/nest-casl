import { CustomDecorator, Type } from '@nestjs/common';
import { uniq, without } from 'lodash';

import { CHECK_POLICIES_KEY, PolicyMetadataDescriptor } from '../policies-key';
import { PolicyDescriptor, PolicyDescriptorMask } from '../types';

export const addPolicyMetadata: <K extends PolicyMetadataDescriptor['type'], V extends PolicyDescriptor<any> | PolicyDescriptorMask<any, any> = any>(
	metadataKey: K,
	metadataValue: V
) => CustomDecorator<K> =
	<K extends PolicyMetadataDescriptor['type']>( metadataKey: K, metadataValue: any ): any =>
		( target: any ) => {
			if( metadataKey === 'policy' ){
				// target = target.constructor;
			}
			const metadata: PolicyMetadataDescriptor[] = Reflect.getMetadata( CHECK_POLICIES_KEY, target ) ?? [];
			metadata.unshift( { type: metadataKey, policy: metadataValue } as PolicyMetadataDescriptor );
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
