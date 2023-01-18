import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import TradePage from "components/pages/TradePage/TradePage";
import BridgePage from "components/pages/BridgePage/BridgePage";
import PoolPage from "components/pages/PoolPage/PoolPage";
import Security from "components/pages/Security";

export const routes = [
  { path: "/", comp: TradePage },
  { path: "/bridge/:tab?", comp: BridgePage },
  { path: "/wrapper/:tab?", comp: BridgePage },
  {
    path: "/security",
    comp: Security,
    children: [],
  },
  { path: "/pool", comp: PoolPage },
];

const AppRoutes = () => {
  return (
    <>
      <Router>
        <Switch>
          {routes.map(({ path, comp }) => (
            <Route exact key={path} path={path} component={comp} />
          ))}
        </Switch>
      </Router>
    </>
  );
};

export default AppRoutes;
