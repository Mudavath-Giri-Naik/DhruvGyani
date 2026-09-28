import { existsSync } from "node:fs";
import { resolve } from "node:path";

/** Load .env.local (then .env) for CLI scripts. Values are never printed. */
export function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    const p = resolve(process.cwd(), f);
    if (existsSync(p)) process.loadEnvFile(p);
  }
}

export function requireEnv(name: string, hint: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`\n✖ ${name} is not set. ${hint}\n  See SETUP.md.`);
    process.exit(1);
  }
  return v;
}
