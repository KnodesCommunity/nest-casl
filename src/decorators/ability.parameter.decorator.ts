import { Ability } from '@casl/ability';
import { ExecutionContext, createParamDecorator } from '@nestjs/common';

/**
 * A parameter decorator factory that retrieve the ability of the current request.
 *
 * @category Decorators
 * @param required - Set to `false` to not throw if no ability was found for the request. Defaults to `true`.
 * @returns a parameter decorator that will set the parameter value to the ability. If not {@link required} and none is found, a new empty ability will be created.
 */
export const InjectAbility: ( required?: boolean ) => ParameterDecorator =
	createParamDecorator( ( required: boolean | undefined, execCtx: ExecutionContext ) => {
		// Use ??= once on node>14
		required = required ?? true;
		const { ability } = execCtx.switchToHttp().getRequest();
		if( !ability && required ){
			throw new Error( 'Ability is required' );
		}
		return ability || new Ability();
	} );
