// 02 §5.7: in Phase 1 the mock backend is what makes an environment non-production, so the
// same flag gates the simulator, the test accounts and the NON-PRODUCTION chip. Gated on the
// flag only, never on NODE_ENV: the Phase 1 production build mocks too.
export const IS_NON_PRODUCTION = process.env.NEXT_PUBLIC_API_MOCKING === 'enabled'
