import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// Node 24 runs the .ts files directly (type stripping); the source uses extensionless relative imports
// (Vite style), so retry those with ".ts". No bundler needed (esbuild is no longer installed since Vite 8).
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.startsWith(".") && !/\.[cm]?[jt]s$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
      throw error;
    }
  },
});

{
  const { evaluate, levelOptions, cidrOptions } = await import("../src/lab/games/vpc/rules.ts");
  const counts = [];

  for (let level = 1; level <= 3; level++) {
    const settings = levelOptions[level - 1];
    let tested = 0;
    let passes = 0;
    const selected = {};
    const enumerate = (index) => {
      if (index === settings.length) {
        tested++;
        const config = { ...selected, cidrs: [] };
        const result = evaluate(level, config);
        if (result.ok) {
          passes++;
          for (const setting of settings) assert.equal(config[setting.key], setting.answer, `L${level} accepted non AWS-correct ${setting.key}=${config[setting.key]}`);
        } else assert.ok(result.hint?.trim(), `L${level} failing combination returned no hint: ${JSON.stringify(config)}`);
        return;
      }
      const setting = settings[index];
      for (const option of setting.options) {
        selected[setting.key] = option;
        enumerate(index + 1);
      }
    };
    enumerate(0);
    assert.equal(passes, 1, `L${level} expected exactly one passing combination, got ${passes}`);
    counts.push({ level, tested, passes });
  }

  let tested = 0;
  let passes = 0;
  const cidrs = Array(4);
  const enumerateCidrs = (index) => {
    if (index === 4) {
      tested++;
      const expected = cidrs.every((cidr) => cidr.startsWith("10.0.")) && new Set(cidrs).size === 4 && !cidrs.includes("10.0.0.0/16");
      const result = evaluate(4, { cidrs: [...cidrs] });
      assert.equal(result.ok, expected, `L4 mismatch for ${JSON.stringify(cidrs)}: expected ${expected}, got ${result.ok}`);
      if (expected) passes++;
      else assert.ok(result.hint?.trim(), `L4 failing assignment returned no hint: ${JSON.stringify(cidrs)}`);
      return;
    }
    for (const option of cidrOptions) {
      cidrs[index] = option;
      enumerateCidrs(index + 1);
    }
  };
  enumerateCidrs(0);
  counts.push({ level: 4, tested, passes });
  console.log(`VPC rules exhaustive check passed (${counts.reduce((sum, row) => sum + row.tested, 0)} combinations)`);
  for (const row of counts) console.log(`Level ${row.level}: ${row.tested} combinations, ${row.passes} passes`);
}
