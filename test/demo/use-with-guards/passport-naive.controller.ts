import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Policy } from '@knodes/nest-casl';

@Controller( '/passport/naive' )
@Policy( { action: 'admin', subject: 'something' } ) // **MUST** be above the guard extracting infos from your request.
@UseGuards( AuthGuard( 'jwt' ) )
export class PassportNaiveTestController {
	@Get()
	public method(){
		// ...
	}
}
