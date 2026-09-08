export const hasAnthropicKey = () => Boolean(process.env.ANTHROPIC_API_KEY);
export const hasUnsplashKey = () => Boolean(process.env.UNSPLASH_ACCESS_KEY);
export const hasPexelsKey = () => Boolean(process.env.PEXELS_API_KEY);
export const hasNimbleKey = () =>
  Boolean(process.env.NIMBLE_API_KEY && process.env.NIMBLE_ACCOUNT_ID);
export const hasBasetenKey = () =>
  Boolean(process.env.BASETEN_API_KEY && process.env.BASETEN_MODEL_URL);
export const hasSalesforceCreds = () =>
  Boolean(
    process.env.SALESFORCE_LOGIN_URL &&
      process.env.SALESFORCE_USERNAME &&
      process.env.SALESFORCE_PASSWORD &&
      process.env.SALESFORCE_TOKEN
  );

export const integrationStatus = () => ({
  anthropic: hasAnthropicKey(),
  unsplash: hasUnsplashKey(),
  pexels: hasPexelsKey(),
  nimble: hasNimbleKey(),
  baseten: hasBasetenKey(),
  salesforce: hasSalesforceCreds(),
});
