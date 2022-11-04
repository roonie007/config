import { assertArrayIncludes, assertEquals, assertThrows } from 'https://deno.land/std@0.134.0/testing/asserts.ts';
import donfig from './mod.ts';

const sampleConfigData = {
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
  hasProxy: {
    type: Boolean,
    default: false,
  },
  today: {
    type: Date,
    default: new Date(),
  },
  days: {
    type: Array,
    default: ['monday', 'sunday'],
  },
};

const sampleConfigDataWithEnvVariable = {
  host: {
    type: String,
    env: 'TEST_HOST',
  },
};

Deno.test('Should validate the config', () => {
  const myConfig = donfig(sampleConfigData);
  myConfig.validate();
  const config = myConfig.getConfig();

  assertEquals(config.api.host, sampleConfigData.api.host.default);
  assertEquals(config.api.port, sampleConfigData.api.port.default);
  assertEquals(config.hasProxy, sampleConfigData.hasProxy.default);
  assertEquals(config.today, sampleConfigData.today.default);
  assertEquals(config.days[0], sampleConfigData.days.default[0]);
  assertEquals(config.days[1], sampleConfigData.days.default[1]);
});

Deno.test('Should validate the config with env variable', () => {
  Deno.env.set('TEST_HOST', 'some-host');

  const myConfig = donfig(sampleConfigDataWithEnvVariable);
  myConfig.validate();
  const config = myConfig.getConfig();

  assertEquals(config.host, Deno.env.get('TEST_HOST'));
  Deno.env.delete('TEST_HOST');
});

Deno.test('Should have the changed env value', () => {
  Deno.env.set('TEST_HOST', 'some-host');

  const myConfig = donfig(sampleConfigDataWithEnvVariable);

  assertEquals(myConfig.getConfig().host, 'some-host');

  Deno.env.set('TEST_HOST', 'another-host');
  assertEquals(myConfig.getConfig().host, 'some-host');

  myConfig.reloadValues();
  assertEquals(myConfig.getConfig().host, 'another-host');

  Deno.env.delete('TEST_HOST');
});

Deno.test(
  'Should throw an error when env variable is missing and no default value',
  () => {
    const myConfig = donfig(sampleConfigDataWithEnvVariable);
    assertThrows(() => myConfig.validate());
  },
);

Deno.test(
  'Should not throw when optional is true and NO env variable NOR default value',
  () => {
    const myConfig = donfig({
      host: {
        type: String,
        env: 'TEST_HOST',
        optional: true,
      },
    });

    myConfig.validate();

    assertEquals(myConfig.getConfig().host, undefined);
  },
);

Deno.test('Should be null', () => {
  const myConfig = donfig({
    host: {
      type: String,
      env: 'TEST_HOST',
      nullable: true,
      default: null,
    },
  });

  myConfig.validate();

  assertEquals(myConfig.getConfig().host, null);
});

Deno.test('Should validate a nested config', () => {
  const myConfig = donfig({
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

  myConfig.validate();

  assertEquals(myConfig.getConfig().this.is.a.nested.value, undefined);
});

Deno.test(
  'Should validate the config with env variable with type number',
  () => {
    Deno.env.set('TEST_NUMBER', '8080');

    const myConfig = donfig({
      port: {
        type: Number,
        env: 'TEST_NUMBER',
      },
    });
    myConfig.validate();
    const config = myConfig.getConfig();

    assertEquals(config.port, 8080);
    Deno.env.delete('TEST_NUMBER');
  },
);

Deno.test(
  'Should validate the config with env variable with type array',
  () => {
    Deno.env.set('TEST_ARRAY', '0,1,10,100');

    const myConfig = donfig({
      array: {
        type: Array,
        env: 'TEST_ARRAY',
      },
    });
    myConfig.validate();
    const config = myConfig.getConfig();

    assertArrayIncludes(config.array, ['0', '1', '10', '100']);
    Deno.env.delete('TEST_ARRAY');
  },
);

Deno.test('Should validate the config with env variable with type Date', () => {
  Deno.env.set('TEST_DATE', '05 October 2011 14:48 UTC');

  const myConfig = donfig({
    date: {
      type: Date,
      env: 'TEST_DATE',
    },
  });
  myConfig.validate();
  const config = myConfig.getConfig();

  assertEquals(config.date.getFullYear(), 2011);
  assertEquals(config.date.getMonth(), 9);
  assertEquals(config.date.getDate(), 5);
  Deno.env.delete('TEST_DATE');
});

Deno.test(
  'Should validate the config even if the parent and nested keys have the same name',
  () => {
    Deno.env.set('TEST_DATE', '05 October 2011 14:48 UTC');

    const myConfig = donfig({
      test1: {
        test1: {
          type: String,
          default: 'test1',
        },
        test2: {
          test1: {
            type: String,
            default: 'nested-test1',
          },
          test2: {
            type: String,
            default: 'nested-test2',
          },
        },
      },
    });
    myConfig.validate();
    const config = myConfig.getConfig();

    assertEquals(config.test1.test1, 'test1');
    assertEquals(config.test1.test2.test1, 'nested-test1');
    assertEquals(config.test1.test2.test2, 'nested-test2');
  },
);
