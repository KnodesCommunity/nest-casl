import { bindPolicyDecorators } from '@scitizen/nest-casl';

import { MyAbility } from './ability';

export const MyPolicies = bindPolicyDecorators<MyAbility>( /* you can even pass some guards here ! */ );
