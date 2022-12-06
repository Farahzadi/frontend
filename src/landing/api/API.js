import { getAPIUrl } from '../utils/env';

export const getNetworks = async () => {
  return await fetch(`${getAPIUrl()}/networks`)
    .then((res) => {
      if (res.status === 200) {
        return res.json();
      }
    })
    .catch((err) => {
      console.log(err);
    });
};
export const getTradeStats = async () => {
  return await fetch(`${getAPIUrl()}/markets/summary`)
    .then((res) => {
      if (res.status === 200) {
        return res.json();
      }
    })
    .catch((err) => {
      console.log(err);
    });
};
