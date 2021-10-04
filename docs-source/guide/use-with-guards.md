Most of the times, you want to execute some guards before checking CASL policies, to extract some user informations before generating its abilities.

This page will show you the various way to do.

Let's assume you have the following {@link CaslAbilityFactory `CaslAbilityFactory`}:

{@codeblock test/use-with-guards/ability-factory.service.ts | src/ability-factory.service.ts}

# The naïve approach

> This method is **not recommanded**. You might skip directly to the [recommended approach](#the-recommended-approach)

## Without any more dependencies

This method does not require any external dependency, and is as close to NestJS as possible.

{@codeblock folded test/use-with-guards/naive.guard.ts | src/guards/naive.guard.ts}

Assuming the guard does the following (see above for an example implementation):
* Users without an `Authorization` header will see an `Unauthorized` exception.
* Users with an invalid `Authorization` header will see a `Forbidden` exception.
* Users with a valid `Authorization` header will be allowed to continue, and the property `user` is set on the `request`.

> Yeah, I'm aware that in an ideal world, a [`Middleware`](https://docs.nestjs.com/middleware) or an [`Interceptor`](https://docs.nestjs.com/interceptors) should take care of setting the `user` property on the `Request`. But fact is that [`@nestjs/passport`](https://www.npmjs.com/package/@nestjs/passport) does it [in a guard](https://github.com/nestjs/passport/blob/6aef921c7566766d0eb9e79d2c8235177c539863/lib/auth.guard.ts#L58)

{@codeblock test/use-with-guards/naive.controller.ts | src/controllers/naive.controller.ts}

Now,
* Users without an `Authorization` header will see an `Unauthorized` exception (from the `NaiveGuard`).
* Users with an invalid `Authorization` header will see a `Forbidden` exception (from the `NaiveGuard`).
* Users with an `Authorization` header that does not give them access to the ressource will see a `Forbidden` exception (from the {@link PoliciesGuard `PoliciesGuard`}).
* Users with an `Authorization` header that give them access to the ressource will succeed.

## Using [`@nestjs/passport`](https://www.npmjs.com/package/@nestjs/passport)

If you're using `passport`, you can delegate the user retrieval. Let's say you have a JWT `passport` strategy.

{@codeblock folded test/use-with-guards/jwt-passport.strategy.ts | src/strategies/jwt-passport.strategy.ts}

Still using the naive approach, you can then declare the controller like this:

{@codeblock test/use-with-guards/passport-naive.controller.ts | src/controllers/passport-naive.controller.ts}

## The tests

Wanna see the behavior as tests ? Here you are !

{@codeblock folded test/use-with-guards/naive-test.e2e-spec.ts}

# The recommended approach

What's the problem about the naïve approach above ? Well, there are 2.
1. *The readability*: The `UseGuards` decorator is placed **below** the {@link Policy `Policy`} decorator, but is ran **before** it.
2. *The reusability*: If you're using multiple authentication strategies in the same app, you might have to apply guards **and** the policies on each method depending on the context. Moreover, if you want to type-check your policies, you might prefer to have abilities presets.

## About readability

You can use {@link Policy.usingGuard `Policy.usingGuard`} or {@link PoliciesMask.usingGuard `PoliciesMask.usingGuard`} to prepended guards to the decorator factory. Those calls are cumulative, and you can do multiple subsequent calls to join guards using an `and` condition. If you provide an array of guards, they be evaluated using an `or` condition.

{@codeblock test/use-with-guards/recommended.controller.ts#Recommended simple controller | src/controllers/recommended.controller.ts}

## About reusability

You can even prepare a policy decorator with guards or {@link PolicyDescriptor `PolicyDescriptor`}:

{@codeblock test/use-with-guards/recommended.controller.ts#Recommended bound | src/policies.ts}

Then, use those presets in your controller:

{@codeblock test/use-with-guards/recommended.controller.ts#Recommended bound controller | src/recommended-bound.controller.ts}

Now, both `method1` and `method2` will run if
* the user is authenticated through `jwt` strategy
* it passes either `ExtraGuard1` or `ExtraGuard2`
* and he has admin role.

> Note that you can use {@link bindPolicyDecorators `bindPolicyDecorators`} to bind *both* {@link Policy `Policy`} and {@link PoliciesMask `PoliciesMask`}

## The tests

This is tested, of course. Just see by yourself.

{@codeblock folded test/use-with-guards/recommended-test.e2e-spec.ts}

# What next ?

{@page Better type constraints}