import { AbilityBuilder, PureAbility } from '@casl/ability';
import { Injectable } from '@nestjs/common';

import { CaslAbilityFactory } from '@knodes/nest-casl';

@Injectable()
export class AbilityFactory implements CaslAbilityFactory {
	// Here, `request` is the express or fastify request. You might get infos from it.
	public createFromRequest( _request: unknown ): PureAbility {
		const { user } = ( _request as any );
		const abilityBuilder = new AbilityBuilder( PureAbility );
		if( user?.role === 'admin' ) {
			abilityBuilder.can( 'admin', 'something' );
		}
		return abilityBuilder.build();
	}
}
