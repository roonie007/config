import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.134.0/testing/asserts.ts";
import donfig from "./mod.ts";

const sampleConfigData = {
  api: {
    host: {
      type: String,
      default: "localhost",
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
    default: ["monday", "sunday"],
  },
};

const sampleConfigDataWithEnvVariable = {
  host: {
    type: String,
    env: "TEST_HOST",
  },
};

Deno.test("Should validate the config", () => {
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

Deno.test("Should validate the config with env variable", () => {
  Deno.env.set("TEST_HOST", "some-host");

  const myConfig = donfig(sampleConfigDataWithEnvVariable);
  myConfig.validate();
  const config = myConfig.getConfig();

  assertEquals(config.host, Deno.env.get("TEST_HOST"));
  Deno.env.delete("TEST_HOST");
});

Deno.test(
  "Should throw an error when env variable is missing and no default value",
  () => {
    const myConfig = donfig(sampleConfigDataWithEnvVariable);
    assertThrows(() => myConfig.validate());
  }
);

Deno.test(
  "Should not throw when optional is true and NO env variable NOR default value",
  () => {
    const myConfig = donfig({
      host: {
        type: String,
        env: "TEST_HOST",
        optional: true,
      },
    });

    myConfig.validate();

    assertEquals(myConfig.getConfig().host, undefined);
  }
);

Deno.test("Should be null", () => {
  const myConfig = donfig({
    host: {
      type: String,
      env: "TEST_HOST",
      nullable: true,
      default: null,
    },
  });

  myConfig.validate();

  assertEquals(myConfig.getConfig().host, null);
});

Deno.test("Should validate a nested config", () => {
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
