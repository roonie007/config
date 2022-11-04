import type { typed } from './deps.ts';

interface CommonConfigFieldSchema {
  env?: string;
  default?: unknown;
  nullable?: boolean;
  optional?: boolean;
}

interface StringConfigFieldSchema extends CommonConfigFieldSchema {
  type?: typeof String;
  default?: string;
}
interface NumberConfigFieldSchema extends CommonConfigFieldSchema {
  type?: typeof Number;
  default?: number;
}
interface BooleanConfigFieldSchema extends CommonConfigFieldSchema {
  type?: typeof Boolean;
  default?: boolean;
}
interface DateConfigFieldSchema extends CommonConfigFieldSchema {
  type?: typeof Date;
  default?: Date;
}
interface ArrayConfigFieldSchema extends CommonConfigFieldSchema {
  type?: typeof Array;
  default?: Array<unknown>;
}

export type ConfigFieldSchema =
  | StringConfigFieldSchema
  | NumberConfigFieldSchema
  | BooleanConfigFieldSchema
  | DateConfigFieldSchema
  | ArrayConfigFieldSchema;

export interface ConfigSchema {
  [key: string]:
    | ConfigFieldSchema
    | Record<string, ConfigFieldSchema>
    | Record<string, ConfigSchema>;
}

type GetTypeFromConstructorString<T> = T extends typeof String ? string : never;
type GetTypeFromConstructorNumber<T> = T extends typeof Number ? number : never;
type GetTypeFromConstructorBoolean<T> = T extends typeof Boolean ? boolean
  : never;
type GetTypeFromConstructorDate<T> = T extends typeof Date ? Date : never;
type GetTypeFromConstructorArray<T> = T extends typeof Array ? Array<unknown>
  : never;

type GTC<T> =
  | GetTypeFromConstructorString<T>
  | GetTypeFromConstructorNumber<T>
  | GetTypeFromConstructorBoolean<T>
  | GetTypeFromConstructorDate<T>
  | GetTypeFromConstructorArray<T>;

type GetTypeFromConstructor<T, N, O> = GTC<T> & N extends true ? O extends true ? GTC<T> | null | undefined
  : GTC<T> | null
  : GTC<T> & O extends true ? N extends true ? GTC<T> | null | undefined
    : GTC<T> | undefined
  : GTC<T>;

export type Overwrite<T> = {
  [Property in keyof T]: T[Property] extends ConfigFieldSchema ? GetTypeFromConstructor<
      T[Property]['type'],
      T[Property]['nullable'],
      T[Property]['optional']
    >
    : Overwrite<T[Property]>;
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Record<string, unknown> ? DeepPartial<T[P]>
    : T[P];
};

export type TypedFunction = (
  x: unknown,
) => typed.Result<
  string | number | boolean | Date | Array<unknown> | null | undefined
>;
