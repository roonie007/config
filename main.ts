import { Shape } from "https://deno.land/x/typed@v3.1.2/common.ts";
import { typed, deepmerge } from "./deps.ts";
import type {
  ConfigFieldSchema,
  ConfigSchema,
  DeepPartial,
  Overwrite,
  TypedFunction,
} from "./types.ts";

const getValue = ({
  type,
  env,
  default: defaultValue,
  nullable,
  optional,
}: ConfigFieldSchema) => {
  let value: unknown = undefined;

  if (env) {
    value = Deno.env.get(env);
  }

  if (value === undefined && defaultValue !== undefined) {
    value = defaultValue;
  }

  if (value === undefined) {
    if (optional) {
      return undefined;
    }
  }
  if (value === null) {
    if (nullable) {
      return null;
    }
  }

  if (value !== null && value !== undefined) {
    if (type === Number) {
      return Number(value);
    }

    if (type === Boolean) {
      return Boolean(value);
    }
    if (type === Date) {
      return new Date(value as string);
    }
    if (type === Array && typeof value === "string") {
      return (value as string).split(",");
    }
  }

  return value;
};

export const iterateOverSchema = ({
  object,
  parentPath = "",
  fn,
}: {
  object: Record<string, ConfigSchema | ConfigFieldSchema>;
  parentPath: string;
  fn: (object: ConfigFieldSchema, path: string) => void;
}) => {
  for (const key in object) {
    const path = `${parentPath ? parentPath + "." : ""}${key}`;
    if (object[key].type) {
      fn(object[key], path);
    } else {
      iterateOverSchema({
        fn,
        object: (object as ConfigSchema)[key] as ConfigSchema,
        parentPath: path,
      });
    }
  }
};

export const iterateOverSchemaData = (schema: Shape) => {
  for (const key in schema) {
    if (typeof schema[key] === "object") {
      schema[key] = iterateOverSchemaData(schema[key] as unknown as Shape);
    }
  }

  return typed.object(schema);
};

export default <T = ConfigSchema>(schema: T) => {
  type ConfigType = Overwrite<T>;
  type PartialConfigType = DeepPartial<ConfigType>;

  const valueObject: Record<string, unknown> = {};
  const merges: Array<PartialConfigType> = [];

  const validationSchemaData: Record<string, unknown | TypedFunction> = {};

  iterateOverSchema({
    object: schema as unknown as ConfigSchema,
    parentPath: "",
    fn: (object, path) => {
      let toAccessObject: Record<string, unknown> = valueObject;
      let toAccessSchemaData = validationSchemaData;
      let typedFunction: TypedFunction = typed.string;

      switch (object.type) {
        case String:
          typedFunction = typed.string;
          break;
        case Number:
          typedFunction = typed.number;
          break;

        case Boolean:
          typedFunction = typed.boolean;
          break;

        case Array:
          typedFunction = typed.array(typed.any);
          break;

        case Date:
          typedFunction = typed.date;
          break;
      }

      const keys = path.split(".");

      for (const [i, key] of keys.entries()) {
        if (i === keys.length - 1) {
          toAccessObject[key] = getValue(object);

          // Schema data
          toAccessSchemaData[key] = typedFunction;
          if (object.nullable) {
            toAccessSchemaData[key] = typed.nullable(
              toAccessSchemaData[key] as TypedFunction
            );
          }
          if (object.optional) {
            toAccessSchemaData[key] = typed.optional(
              toAccessSchemaData[key] as TypedFunction
            );
          }
        } else {
          if (!toAccessObject[key]) {
            toAccessObject[key] = {};

            // Schema data
            toAccessSchemaData[key] = {};
          }

          toAccessObject = toAccessObject[key] as Record<string, unknown>;
          toAccessSchemaData = toAccessSchemaData[key] as Record<
            string,
            unknown
          >;
        }
      }
    },
  });

  // Finalize schema
  const validationSchema = iterateOverSchemaData(
    validationSchemaData as unknown as Shape
  ) as TypedFunction;

  const getConfig = () => deepmerge(valueObject, ...merges) as ConfigType;
  const getSchema = () => validationSchema;
  const override = (config: DeepPartial<ConfigType>) => merges.push(config);
  const validate = () => {
    const result = getSchema()(getConfig());
    if (!result.ok) {
      const errors = result.errors
        .map(({ message, path }) => `\n   ==> ${message} on ${path.join(".")}`)
        .join("\n");

      throw new Error(errors);
    }
  };

  return {
    getConfig,
    getSchema,
    override,
    validate,
  };
};
