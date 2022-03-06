import { AbilityBuilder, PureAbility } from '@casl/ability';
import { Injectable } from '@nestjs/common';

import { CaslAbilityFactory } from '@knodes/nest-casl';

import { MyAbility } from './ability';

@Injectable()
export class AbilityFactory implements CaslAbilityFactory<MyAbility> {
	// Here, `request` is the express or fastify request. You might get infos from it.
	public createFromRequest( _request: unknown ): MyAbility {
		const { user } = ( _request as any );
		const abilityBuilder = new AbilityBuilder<MyAbility>( PureAbility );
		if( user?.role === 'admin' ) {
			abilityBuilder.can( 'admin', 'ImportantData' );
		}
		return abilityBuilder.build();
	}
}
