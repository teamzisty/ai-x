import { dotenv } from "./deps.ts"

dotenv.configSync({
    export: true,
    path: "./.env",
})

export const Secret = {
    TOKEN: Deno.env.get("TOKEN")!,
}