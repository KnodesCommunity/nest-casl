import { Controller, Get } from '@nestjs/common';

import { Policy } from '@knodes/nest-casl';

import { MyAbility } from './ability';

@Controller()
// @ts-expect-error -- `something` is not a valid subject
@Policy<MyAbility>( { action: 'admin', subject: 'something' } )
// @ts-expect-error -- `rick-roll` is not a valid action
@Policy<MyAbility>( { action: 'rick-roll', subject: 'ImportantData' } )
// @ts-expect-error -- `read` is not a valid action on `ImportantData`
@Policy<MyAbility>( { action: 'read', subject: 'ImportantData' } )
@Policy<MyAbility>( { action: 'read', subject: 'PublicData' } )
// ...
export class TestController {
	@Get()
	public method(){
		// ...
	}
}
