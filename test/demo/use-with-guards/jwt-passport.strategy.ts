import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';

@Injectable()
export class JwtPassportStrategy extends PassportStrategy( Strategy, 'jwt' ) {
	public static readonly KEY = 'this-is-a-secret';
	public constructor(){
		super( {
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: JwtPassportStrategy.KEY,
		} as StrategyOptions );
	}

	public validate( user: any ){
		return user;
	}
}
