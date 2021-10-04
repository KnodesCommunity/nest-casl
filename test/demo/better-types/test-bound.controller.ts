import { Controller, Get } from '@nestjs/common';

import { MyPolicies } from './my-policies';

@Controller()
@MyPolicies.PoliciesMask( {
	'*': { action: 'admin', subject: 'ImportantData' },
	'read': { action: 'read', subject: 'PublicData' },
	'create': { action: 'create', subject: 'PublicData' },
} )
export class TestController {
	@Get()
	@MyPolicies.Policy( { handle: ability => ability.can( 'read', 'PublicData' ) } )
	public create(){
		// ...
	}
	@Get()
	public read(){
		// ...
	}

	@Get()
	public admin(){
		// ...
	}
}
