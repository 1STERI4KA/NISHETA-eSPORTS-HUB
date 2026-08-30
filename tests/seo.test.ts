import assert from "node:assert/strict";
import test from "node:test";
import robots from "../src/app/robots";
import sitemap from "../src/app/sitemap";

test("robots keeps private and service routes out of search crawlers", () => {
  const config = robots();

  const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;

  assert.equal(rules?.allow, "/");
  assert.deepEqual(rules?.disallow, ["/admin/", "/api/", "/play", "/lobby"]);
  assert.equal(config.sitemap, "https://nisheta-e-sports-hub.vercel.app/sitemap.xml");
});

test("sitemap contains only public indexable routes", () => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);

  assert.equal(entries.length, 12);
  assert.ok(urls.includes("https://nisheta-e-sports-hub.vercel.app/"));
  assert.ok(urls.includes("https://nisheta-e-sports-hub.vercel.app/draft"));
  assert.ok(urls.includes("https://nisheta-e-sports-hub.vercel.app/gallery"));
  assert.ok(urls.includes("https://nisheta-e-sports-hub.vercel.app/confessions"));
  assert.ok(!urls.some((url) => url.includes("/admin")));
  assert.ok(!urls.some((url) => url.includes("/api/")));
  assert.ok(!urls.some((url) => url.includes("/lobby")));
});
