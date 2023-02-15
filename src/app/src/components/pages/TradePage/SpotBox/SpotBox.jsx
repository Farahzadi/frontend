import React, { useEffect, useState } from "react";
import { connect, useSelector, useDispatch } from "react-redux";
// css
import "./SpotBox.css";
// assets
import SpotForm from "components/molecules/SpotForm/SpotForm";
//actions
import {
  setOrderType,
  orderTypeSelector,
  allOrdersSelector,
  orderSideSelector,
  setOrderSide,
} from "lib/store/features/api/apiSlice";
import Core from "lib/api/Core";
import { OrderSide } from "lib/interface";
import { styled } from "@mui/system";

const OrderSideTab = styled("button")(({ theme, active }) => ({
  color: "#fff",
  textTransform: "uppercase",
  margin: "5px 10px",
  border: "none",
  height: "35px",
  borderRadius: "10px",
  width: "100%",
  backgroundColor: active ? theme.palette.primary.main : theme.palette.secondary.main,
  boxShadow: active ? `0px 0px 15px 0px ${theme.palette.primary.main}` : "",
}));
const OrderTypeTab = styled("button")(({ theme, active }) => ({
  color: active ? theme.palette.primary.main : "inherit",
  background: "inherit",
  outline: "none",
  border: "none",
  fontSize: "1rem",
  fontWeight: "500",
  marginRight: "20px",
  cursor: "pointer",
}));
const SpotBox = () => {
  // const [orderSide, setOrderSide] = useState(OrderSide.b);
  const orderType = useSelector(orderTypeSelector);
  const allOrders = useSelector(allOrdersSelector);
  const orderSide = useSelector(orderSideSelector);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!orderSide) {
      dispatch(setOrderSide("b"));
    }
  }, []);
  const updateOrderSide = orderSide => {
    dispatch(setOrderSide(orderSide));
  };

  const updateOrderType = orderType => {
    dispatch(setOrderType(orderType));
  };

  const orderSides = [
    { id: "s", title: "sell" },
    { id: "b", title: "buy" },
  ];
  const orderTypes = [
    { id: "limit", title: "Limit" },
    { id: "marketOrder", title: "Market" },
  ];
  return (
    <>
      <div className="spot_box">
        <div className="spot_head">
          <div className="sh_l">
            <h2>SPOT</h2>
          </div>
          <div className="sh_r">{/* Gas fee: $1 / trade */}</div>
        </div>
        <div className="buy_or_sell pt-2">
          {orderSides.map(val => (
            <OrderSideTab key={val.id} onClick={() => updateOrderSide(val.id)} active={val.id === orderSide}>
              {val.title}
            </OrderSideTab>
          ))}
        </div>
        <div className="spot_tabs">
          <div className="st_l">
            {orderTypes.map(val => (
              <OrderTypeTab active={val.id === orderType} onClick={() => updateOrderType(val.id)}>
                {val.title}
              </OrderTypeTab>
            ))}
          </div>
        </div>
        <div className="spot_bottom">
          <SpotForm />
        </div>
      </div>
    </>
  );
};

export default SpotBox;
