import { CaslAbilityFactory } from './casl-ability.factory';

class MockCaslAbilityFactory implements CaslAbilityFactory<any>{
	// eslint-disable-next-line @typescript-eslint/tslint/config
	public createFromRequest( _request: unknown ) {
		throw new Error( 'Method not implemented.' );
	}
}
describe( 'CaslAbilityFactory', () => {
	it( 'should be defined', () => {
		expect( new MockCaslAbilityFactory() ).toBeDefined();
	} );
} );
