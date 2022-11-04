import donfig from '../mod.ts';

const config = donfig({
  hey: {
    type: String,
    default: 'hey',
    nullable: true,
  },
  api: {
    host: {
      type: String,
    },
    port: {
      type: Number,
      env: 'API_PORT',
      default: 8080,
    },
  },
  mongo: {
    host: {
      type: String,
      optional: true,
    },
    port: {
      type: Number,
      nullable: true,
      default: null,
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

try {
  config.validate(); // You should see an error "Expecting type 'string'. Got type 'undefined'. on api.host"
} catch (err) {
  console.error(err);
}

config.override({ api: { host: 'localhost' } });

try {
  config.validate(); // Config is valid
  console.log('\n\nConfig is valid');
} catch (err) {
  console.error(err);
}
