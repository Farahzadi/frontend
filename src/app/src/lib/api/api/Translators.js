export const translators = {
  // used for both initial orders and order updates
  userOrder: o => ({
    chainId: o.network,
    id: o.id,
    market: o.market,
    side: o.side,
    price: +o.price,
    baseQuantity: +o.base_quantity,
    quoteQuantity: +o.quote_quantity,
    expires: o.expiration,
    userAddress: o.user_address,
    status: o.status,
    remaining: +o.unfilled,
    type: o.type,
    createdAt: o.created_at,
    unbroadcasted: o.unbroadcasted,
    makerFee: +o.maker_fee,
    takerFee: +o.taker_fee,
    txHash: o.tx_hash,
    error: o.error,
  }),

  orderBook: o => ({
    price: +o.price,
    remaining: +o.unfilled,
    side: o.side,
  }),

  // used for both initial fills and fill updates
  fills: f => ({
    chainId: f.network,
    id: f.id,
    market: f.market,
    takerSide: f.taker_side,
    price: +f.price,
    amount: +f.amount,
    status: f.status,
    txHash: f.tx_hash,
    takerUserAddress: f.taker_user_address,
    makerUserAddress: f.maker_user_address,
    type: f.type,
    takerOrderAddress: f.taker_order_address,
    makerOrderAddress: f.maker_order_address,
    createdAt: f.created_at,
    makerFee: +f.maker_fee,
    takerFee: +f.taker_fee,
    error: f.error, // tx rejection error message
  }),

  markets_config: c => ({
    market: c.market,
    limitEnabled: c.limit_enabled,
    swapEnabled: c.swap_nabled,
    takerFee: c.taker_fee,
    makerFee: c.maker_fee,
    minMatchAmount: c.min_match_amount,
    minOrderSize: c.min_order_size,
  }),

  markets_stats: s => ({
    market: s.market,
    price: s.last_price,
    priceChange: s.change,
    "24hi": s.high_price,
    "24lo": s.low_price,
    baseVolume: s.base_volume,
    quoteVolume: s.quote_volume,
  }),
};
