import { dotenv } from "./deps.ts"

dotenv.configSync({
    export: true,
    path: "./.env.local",
})

export const Secret = {
    TOKEN: Deno.env.get("TOKEN")!,
}