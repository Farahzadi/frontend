const BLOG = {
  id: 1,
  imgUrl: '/images/Logo.svg',
  title: 'Dex Blog',
  tags: [],
  excerpt:
    'This is the same scenario as user’s private key security in any other layer 1 or layer 2 blockchains. We highly advise users to keep their assets only using non-custodial wallets. For additional security, hardware wallets, such as Ledger and Trezor, are also welcome that are compatible with multiple desktop wallets, such as Metamask.',
  publishDate: '',
};

export const BLOGS = Array.from({ length: 30 }, (val, index) => {
  return { ...BLOG, id: index };
});
