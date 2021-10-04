> This module is compatible with `nestjs@^8.0.0`.

# Setup & configuration

First, install the module:

```bash
npm install @scitizen/nest-casl
```

Then, declare a provider that generate a CASL Ability from the current request.

{@codeblock test/basic-use.e2e-spec.ts#AbilityFactory | src/ability-factory.service.ts}

Import the {@link CaslModule `CaslModule`} in your `AppModule`, and configure it to use your ability factory.

{@codeblock test/basic-use.e2e-spec.ts#AppModule | src/app.module.ts}

You can now start using policy decorators ({@link Policy `Policy`} and {@link PoliciesMask `PoliciesMask`}) in your controllers !

# Basic usage

You can protect all methods of your controller using the {@link Policy `Policy`} class decorator.

{@codeblock test/basic-use.e2e-spec.ts#CatOwnerController | src/cat-owner.controller.ts}

This decorator can also be used to protect individual methods.

{@codeblock test/basic-use.e2e-spec.ts#CatCareController | src/cat-care.controller.ts}

If you want to group various policies in the same decorator at the controller level, use the {@link PoliciesMask `PoliciesMask`} decorator.

{@codeblock test/basic-use.e2e-spec.ts#CatController | src/cat.controller.ts}

Check the tests !

{@codeblock folded test/basic-use.e2e-spec.ts#Test | test/cats.e2e-spec.ts}

# What next ?

{@page Use with guards}