import { ws } from "@rstrpc/client";
import type { Server } from "./bindings.ts";

const client = ws<Server>("ws://localhost:9944/rpc");

client.version().then((version) => console.log({ version })).catch(console.error);
client.user.get("test").then((user) => console.log(user)).catch(console.error);
client.count().then((value) => console.log({ value })).catch(console.error);

await client.countdown(1, 4).subscribe({
	on_data: (data) => {
		console.log("countdown: ", data);
	},
	on_end: () => {
		console.log("countdown done");
	}
});

