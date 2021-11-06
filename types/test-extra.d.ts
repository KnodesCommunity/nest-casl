declare namespace jest {
	// noinspection JSUnusedGlobalSymbols
	interface Matchers<R, T> {
		toHaveBeenExactlyCalledLike( ...calls: Array<Parameters<T>> ): R;
	}
}
