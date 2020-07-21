import { app } from '..';

export function createLogger(...prefix: any[]) {
	return {
		debug: (...args: any[]) => app.config.debug ? console.log("[debug]", ...prefix, ...args) : null,
		log: console.log.bind(console, ...prefix),
		warn: console.log.bind(console, "[warn]", ...prefix),
		error: console.error.bind(console, "[error]", ...prefix)
	};
}