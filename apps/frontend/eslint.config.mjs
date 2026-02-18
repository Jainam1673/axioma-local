import nextCoreVitals from "eslint-config-next/core-web-vitals";

const config = [
	{
		ignores: [".next/**", "playwright-report/**", "test-results/**"],
	},
	...nextCoreVitals,
];

export default config;
