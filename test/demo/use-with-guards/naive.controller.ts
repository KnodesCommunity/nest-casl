import { Controller, Get, UseGuards } from '@nestjs/common';

import { Policy } from '@scitizen/nest-casl';

import { NaiveGuard } from './naive.guard';

@Controller( '/naive' )
@Policy( { action: 'admin', subject: 'something' } ) // **MUST** be above the guard extracting infos from your request.
@UseGuards( NaiveGuard )
export class NaiveTestController {
	@Get()
	public method(){
		// ...
	}
}
