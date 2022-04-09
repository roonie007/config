import donfig from "../mod.ts";
import production from "./production.json" assert { type: "json" };
import test from "./test.json" assert { type: "json" };

Deno.env.set("ENV", "production");

const config = donfig({
  env: {
    type: String,
    env: "ENV",
    default: "test",
  },
  api: {
    host: {
      type: String,
      default: "0.0.0.0",
    },
    port: {
      type: Number,
      optional: true,
    },
  },
});

const { env } = config.getConfig();

if (env === "test") {
  config.override(test);

  console.log(config.getConfig().api.host); // should be localhost
  console.log(config.getConfig().api.port); // should be 8081
} else if (env === "production") {
  config.override(production);

  console.log(config.getConfig().api.host); // should be my-domain.com
  console.log(config.getConfig().api.port); // should be undefined (check optional value bellow)
}
