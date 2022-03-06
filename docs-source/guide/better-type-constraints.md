So far, we were able to configure your policies. But we can't yet check that our `action`s or `subject`s are actually matching what we declared.

# Define the ability type

Let's configure our ability types:

{@codeblock better-types/ability.ts}

Using `MyAbility`, we can't pass anything to `can` or `cannot`: types are constrained.

{@codeblock better-types/ability.typecheck.e2e-spec.ts}

That's great. This will greatly reduce our chances of typos. Moreover, your IDE might now suggest `action`s & `subject`s for you.

# Use the ability type

## With the {@link CaslAbilityFactory `CaslAbilityFactory`}

Let's now use this type in your {@link CaslAbilityFactory `CaslAbilityFactory`}:

{@codeblock better-types/ability-factory.service.ts | src/ability-factory.service.ts}

## With decorators

You can pass your ability as a type parameter to your decorators to constraint your `action`s and `subject`s:

{@codeblock better-types/test.controller.ts | src/test.controller.ts}

But the boring part here is that you have to pass your ability type to **every** decorator in order to constrain them. Hopefully, you can solve this:

{@codeblock better-types/my-policies.ts | src/my-policies.ts}

Then, simply enjoy type contraints !

{@codeblock better-types/test-bound.controller.ts | src/test-bound.controller.ts}
