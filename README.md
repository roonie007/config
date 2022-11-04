# Donfig

Deno module that lets you set some default parameters and then change them for different deployment scenarios.

Configurations are stored in files within your application, and can be overridden and extended by environment variables or external sources.

## Features

- Loading and merging: configurations can be loaded and merged
- Nested structure: keys and values can be organized in a tree structure
- Environmental variables: values can be derived from environmental variables
- Validation: configurations are validated against your schema (presence checking, type checking), generating an error report with all errors that are found
- Intellisense: support Typescript intellisense for the created config

## Usage

```typescript
import donfig from 'https://deno.land/x/donfig/mod.ts';

const config = donfig({
  api: {
    host: {
      type: String,
      default: 'localhost',
    },
    port: {
      type: Number,
      default: 8080,
    },
  },
  this: {
    is: {
      a: {
        nested: {
          value: {
            type: Boolean,
            optional: true,
          },
        },
      },
    },
  },
});

// Perform validation
config.validate({ allowed: 'strict' });

export default config.getConfig();
/** Should return
{
  api: {
    host: "localhost",
    port: 8080
  },
   this: {
    is: {
      a: {
        nested: {
          value: undefined
        },
      },
    },
  },
}
**/
```

### Override

You will certainly have different configuration for testing, development and production, you will need to override your config values in dependence of your
environnement.

```typescript
// ./configs/test.json
{
  "api": {
    "host": "localhost",
    "port": 8081
  }
}

// ./configs/production.json
{
  "api": {
    "host": "my-domain.com",
  }
}

// ./configs/main.ts
import donfig from "https://deno.land/x/donfig/mod.ts";
import production from './production.json' assert { type: 'json' };
import test from './test.json' assert { type: 'json' };

const config = donfig({
  env: {
    type: String,
    env: 'ENV',
    default: 'development'
  },
  api: {
    host: {
      type: String,
      default: "0.0.0.0",
    },
    port: {
      type: Number,
      optional: true
    },
  },
});

const {env} = config.getConfig();

if(env === 'test') {
  config.override(test);

  console.log(config.getConfig().api.host); // should be localhost
  console.log(config.getConfig().api.port); // should be 8081
} else if(env === 'production') {
  config.override(production);

  console.log(config.getConfig().api.host); // should be my-domain.com
  console.log(config.getConfig().api.port); // should be undefined (check optional value bellow)
}
```

### Use an environnement variable

Let's pretend that you have an environnement variable named `API_PORT` with a value `3000`

```typescript
import donfig from 'https://deno.land/x/donfig/mod.ts';

const config = donfig({
  api: {
    host: {
      type: String,
      default: 'localhost',
    },
    port: {
      type: Number,
      env: 'API_PORT',
    },
  },
});

console.log(config.getConfig().api.port); // should be 3000
```

### Optional

By default all field are required, but you can make them optional as the following so even if the variable is undefined, the validation will be still valid

```typescript
import donfig from 'https://deno.land/x/donfig/mod.ts';

const config = donfig({
  host: {
    type: String,
    optional: true,
  },
});

config.validate(); // Should be valid

console.log(config.getConfig().host); // should be undefined
```

### Nullable

Sometimes you need to init a config variable to null, then change it in runtime, it can be done like this

```typescript
import donfig from 'https://deno.land/x/donfig/mod.ts';

const config = donfig({
  host: {
    type: String,
    nullable: true,
    default: null,
  },
});

config.validate(); // Should be valid
console.log(config.getConfig().host); // should be null

config.override({ host: '0.0.0.0' });
console.log(config.getConfig().host); // should be "0.0.0.0"
```

## Testing

```bash
# To test the module just run
deno test --allow-env
```

## More examples

For more examples please check the `examples` for folder and/or the `test.ts` file

## License

MIT
