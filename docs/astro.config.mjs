import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: "https://clack.cc",
	server: {
		headers: {
			'Cross-Origin-Embedder-Policy': 'require-corp',
			'Cross-Origin-Opener-Policy': 'same-origin',
		}
	}
});
