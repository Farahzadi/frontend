const getDocsLink = () => {
  return process.env.NEXT_PUBLIC_DOCS_LINK || '';
};
const getAPIUrl = () => {
  return process.env.APP_BACKEND_API || '';
};

const getBaseUrl = () => {
  return process.env.BASE_URL || '';
};

const getTradeLink = () => {
  return process.env.NEXT_PUBLIC_TRADE_APP_LINK || '';
};

export { getAPIUrl, getBaseUrl, getDocsLink, getTradeLink };
