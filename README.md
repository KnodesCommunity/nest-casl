# @scitizen/nest-casl

<p align="center">
	<a href="http://nestjs.com/" target="_blank"><img src="https://nestjs.com/img/logo-small.svg" height="150" alt="Nest Logo" /></a>
	<span style="font-size: 150px">&nbsp;+&nbsp;</span>
	<a href="https://casl.js.org/v5/en" target="_blank"><img src="https://casl.js.org/v5/51b9cc103e05f66c.png" height="150" alt="CASL Logo"></a>
</p>

<p align="center">A simple decorator-based way to check <a href="https://casl.js.org/v5/en" target="_blank">CASL abilities</a> on <a href="http://nodejs.org" target="_blank">NestJS</a> controllers.</p>

<p align="center">
	<a href="https://github.com/Scitizen/nest-casl/issues" target="_blank"><img src="https://img.shields.io/github/issues/Scitizen/nest-casl" alt="GitHub issues"></a>
	<a href="https://www.npmjs.com/package/@scitizen/nest-casl" target="_blank"><img src="https://img.shields.io/npm/v/@scitizen/nest-casl.svg" alt="NPM Version" /></a>
	<a href="https://www.npmjs.com/package/@scitizen/nest-casl" target="_blank"><img src="https://img.shields.io/npm/l/@scitizen/nest-casl.svg" alt="Package License" /></a>
	<a href="https://www.npmjs.com/package/@scitizen/nest-casl" target="_blank"><img src="https://img.shields.io/npm/dm/@scitizen/nest-casl.svg" alt="NPM Downloads" /></a>
	<a href="https://circleci.com/gh/Scitizen/nest-casl/tree/main" target="_blank"><img src="https://img.shields.io/circleci/build/github/Scitizen/nest-casl/main" alt="CircleCI"></a>
	<a href="https://codeclimate.com/github/Scitizen/nest-casl/maintainability"><img src="https://api.codeclimate.com/v1/badges/21cc8f69c9eac8d36aa9/maintainability" /></a>
	<a href="https://codeclimate.com/github/Scitizen/nest-casl/test_coverage"><img src="https://api.codeclimate.com/v1/badges/21cc8f69c9eac8d36aa9/test_coverage" /></a>
</p>

## Description

Use decorators everywhere to protect your controller methods.

* [:book: Read the docs](https://scitizen.github.io/nest-casl/)
* [:rocket: Get started](https://scitizen.github.io/nest-casl/pages/Guides/getting-started.html)

## Installation

```bash
npm install --save @scitizen/nest-casl @casl/ability
```

## In a nutshell

Declare a new service that converts the user of your request to a *CASL ability*:

```ts
import { Injectable } from '@nestjs/common';
import { AbilityBuilder, PureAbility } from '@casl/ability';
import { CaslAbilityFactory } from '@scitizen/nest-casl';

@Injectable()
export class AbilityFactory implements CaslAbilityFactory {
	// Here, `request` is the express or fastify request. You might get infos from it.
	public createFromRequest( _request: unknown ): PureAbility {
		const abilityBuilder = new AbilityBuilder( PureAbility );
		abilityBuilder.can( 'feed', 'cat' );
		abilityBuilder.can( 'hug', 'cat' );
		abilityBuilder.can( 'pet', 'cat' );
		abilityBuilder.cannot( 'rename', 'cat' );
		return abilityBuilder.build();
	}
}
```

Import the module:

```ts
import { Module } from '@nestjs/common';
import { CaslModule } from '@scitizen/nest-casl';

@Module( {
	imports: [
		CaslModule.withConfig( ( { abilityFactory: AbilityFactory } ) ),
		// ....
	],
} )
export class AppModule {}
```

Use decorators in your controller:

```ts
import { AbilityBuilder, PureAbility } from '@casl/ability';
import { Controller, Get } from '@nestjs/common';
import { InjectAbility, PoliciesMask, Policy } from '@scitizen/nest-casl';

@Controller( '/cat/care' )
@PoliciesMask({
	'pet': { action: 'pet', subject: 'cat' }
})
export class CatCareController {
	// Okay, you can feed.
	@Get( 'feed' )
	@Policy( { action: 'feed', subject: 'cat' } )
	public feed(){
		// ...
	}

	// Well, I guess he won't bite.
	@Get( 'hug' )
	@Policy( { action: 'hug', subject: 'cat' } )
	public hug(){
		// ...
	}

	@Get( 'pet' )
	public pet( @InjectAbility() ability: PureAbility ){
		// ...
	}
}
```

For more details and usage with **guards**, please refer to the [guide](https://scitizen.github.io/nest-casl/pages/Guides/getting-started.html).

## License

@scitizen/nest-casl is [MIT licensed](LICENSE).
