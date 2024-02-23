export type Primitive = Readonly<string | boolean | number>;

export type Option<Value> = Value extends Primitive
	? { value: Value; label?: string; hint?: string }
	: { value: Value; label: string; hint?: string };

export interface SelectOptions<TValue> {
	message: string;
	options: Option<TValue>[];
	initialValue?: TValue;
	maxItems?: number;
}

export type Prettify<T> = {
	[P in keyof T]: T[P];
} & {};
