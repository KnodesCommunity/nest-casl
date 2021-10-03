import { Ability } from '@casl/ability';
import { ExecutionContext, createParamDecorator } from '@nestjs/common';

/**
 * Retrieve the ability of the current request.
 */
export const InjectAbility: ( required?: boolean ) => ParameterDecorator =
	createParamDecorator( ( required: boolean | undefined, execCtx: ExecutionContext ) => {
		required ??= true;
		const { ability } = execCtx.switchToHttp().getRequest();
		if( !ability && required ){
			throw new Error( 'Ability is required' );
		}
		return ability || new Ability();
	} );
