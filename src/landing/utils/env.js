const getDocsLink = () => {
  return process.env.NEXT_PUBLIC_DOCS_LINK || 'https://docs.dexpresso.exchange';
};
const getAPIUrl = () => {
  return process.env.APP_BACKEND_API || 'https://api.dexpresso.exchange/api/v1';
};

const getBaseUrl = () => {
  return process.env.BASE_URL || 'https://dexpresso.exchange';
};

const getTradeLink = () => {
  return process.env.NEXT_PUBLIC_TRADE_APP_LINK || 'https://trade.dexpresso.exchange';
};

export { getAPIUrl, getBaseUrl, getDocsLink, getTradeLink };
