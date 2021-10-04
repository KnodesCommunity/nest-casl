import { Ability } from '@casl/ability';

export type MyAbilities =
	| ['admin', 'ImportantData']
	| ['create' | 'read' | 'update' | 'delete', 'PublicData' ];
export type MyAbility = Ability<MyAbilities>;
