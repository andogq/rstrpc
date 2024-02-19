import { RpcResponse, create_payload } from "./jsonrpc";
import { wrap_promise } from "./proxy";
import { StreamSubscriber } from "./stream";

export type Client = {
	request: (id: string | number, payload: any) => Promise<RpcResponse<any>>,
	subscribe?: (id: string | number, on_data?: (value: any) => void, on_end?: () => void) => (() => void),
};

export function build_client<Server>(client: Client): Server {
	let next_id = 0;

	return new Proxy({}, {
		get: (_, prop) => {
			let method = [prop];

			return new Proxy(() => {}, {
				get: (_target, prop, client) => {
					method.push(prop);

					return client;
				},
				apply: (_target, _this, args) => {
					const id = next_id++;

					const p = new Promise(async (resolve, reject) => {
						const payload = create_payload(id, method.join("."), args);
						const response = await client.request(id, payload);

						if (response.type === "ok") {
							resolve(response.value);
						} else {
							reject(response);
						}
					});

					const subscribe: StreamSubscriber<any> = async ({ on_data, on_end, on_error }) => {
						function error(e) {
							if (on_error) {
								on_error(e);
							}
						}

						// Make sure the client can handle susbcriptions
						if (!client.subscribe) {
							error(new Error("client does not support subscriptions"));
							return () => {};
						}

						// Get the response of the request
						const subscription_id = await p;

						// Result should be a subscription ID
						if (typeof subscription_id !== "string" && typeof subscription_id !== "number") {
							// TODO: Throw an error
							error(new Error("cannot subscribe to subscription"));
							return () => {};
						}

						// Subscribe to incomming requests
						const unsubscribe = client.subscribe(subscription_id, on_data, on_end);

						return unsubscribe;
					};

					return wrap_promise(p, { subscribe });
				}
			});
		}
	}) as unknown as Server;
}