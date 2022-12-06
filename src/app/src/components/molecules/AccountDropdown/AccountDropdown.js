import { useSelector } from "react-redux";
import React, { useState, useEffect } from "react";
import { IoMdLogOut } from "react-icons/io";
import { AiOutlineCaretDown } from "react-icons/ai";
import { styled } from "@mui/material/styles";
import { useCoinEstimator } from "components";
import Loader from "react-loader-spinner";
import { userSelector } from "lib/store/features/auth/authSlice";
import {
  networkSelector,
  balancesSelector,
} from "lib/store/features/api/apiSlice";
import { formatUSD } from "lib/utils";
import api from "lib/api";
import logo from "../../../../src/assets/images/LogoMarkCremeLight.svg";
import { Button } from "@mui/material";

const DropdownDisplay = styled("div")(({ show, theme }) => ({
  position: "absolute",
  zIndex: 99,
  borderRadius: "8px",
  transition: "all 0.2s ease-in-out",
  boxShadow: "0 10px 20px 10px rgba(0, 0, 0, 0.3)",
  width: "360px",
  background: theme.palette.secondary.dark,
  backdropFilter: "blur(4px)",
  transform: show ? "translateY(0)" : "translateY(20px)",
  top: "100%",
  right: 0,
  opacity: show ? 1 : 0,
  pointerEvents: show ? "all" : "none",
  minHeight: "400px",
  display: "flex",
  flexDirection: "column",
  border: `1px solid ${theme.palette.primary.main}`,
}));

const DropdownButton = styled("div")(({}) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  height: "78px",
  transition: "all 0.12s ease-in-out",
  color: "rgba(255, 255, 255, 0.4)",
  userSelect: "none",
  cursor: "pointer",
  fontWeight: "bold",
  padding: "0 16px",
  "&:focus": {
    outline: 0,
  },
  "&:hover": {
    color: "rgba(255, 255, 255, 0.6)",
  },
  "& svg": {
    marginLeft: "5px",
    fontSize: "13px",
  },
}));

const AvatarImg = styled("img")(({}) => ({
  width: "26px",
  height: "26px",
  borderRadius: "35px",
  marginRight: "10px",
}));
const DropdownContainer = styled("div")(({}) => ({
  position: "relative",
}));

const DropdownHeader = styled("div")(({ theme }) => ({
  padding: "20px",
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  "& h3": {
    fontSize: "16px",
    color: theme.palette.text.primary,
  },
}));

const WalletToggle = styled("ul")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  listStyleType: "none",
  border: `1.8px solid ${theme.palette.grey[100]}`,
  borderRadius: "33px",
  height: "33px",
  padding: "3px",
  fontSize: "0.75rem",
}));

const WalletToggleItem = styled("li")(({ selected, theme }) => ({
  display: "block",
  width: "50px",
  borderRadius: "33px",
  padding: "3px",
  textAlign: "center",
  userSelect: "none",
  cursor: "pointer",
  color: selected ? theme.palette.text.secondary : "",
  background: selected ? theme.palette.grey[50] : "",
}));

const CurrencyList = styled("ul")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  listStyleType: "none",
  padding: 0,
}));

const CurrencyListItem = styled("li")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  lineHeight: "1.2",
  fontSize: "14px",
  padding: "12px 20px",
  borderTop: `1px solid ${theme.palette.grey[800]}`,
  width: "100%",
  color: theme.palette.text.primary,
  "& > .currency-icon": {
    width: "24px",
    height: "24px",
    marginRight: "15px",
    objectFit: "contain",
  },
  "& > div strong": {
    display: "block",
  },
  "& > div small": {
    fontSize: "12px",
    color: theme.palette.grey[600],
  },
}));

const DropdownContent = styled("div")(({}) => ({
  flex: "1 1 auto",
  overflowY: "auto",
}));

const DropdownFooter = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-end",
  borderTop: `1px solid ${theme.palette.grey[800]}`,
  borderBottomRightRadius: "8px",
  borderBottomLeftRadius: "8px",
  overflow: "hidden",
  width: "100%",
}));

const SignOutButton = styled(Button)(({ theme }) => ({
  padding: "15px 20px",
  cursor: "pointer",
  fontSize: "13px",
  lineHeight: "1.1",
  color: theme.palette.text.primary,
  background: theme.palette.primary.dark,
  borderLeft: "1px solid rgba(0, 0, 0, 0.1)",
  "& svg": {
    fontSize: "1rem",
    marginInlineEnd: "4px",
  },

  "&:hover": {
    background: theme.palette.error.main,
    color: "#fff",
  },

  "&:active": {
    background: theme.palette.error.main,
    color: "#fff",
  },
}));

const LoaderContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100px",
}));

export const AccountDropdown = () => {
  const user = useSelector(userSelector);
  const [tickers, setTickers] = useState([]);
  const network = useSelector(networkSelector);
  const balanceData = useSelector(balancesSelector);
  const [show, setShow] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState(2);
  const [windowSize, setWindowSize] = useState(getWindowSize());
  const coinEstimator = useCoinEstimator();
  const { profile } = user;
  const layers = [
    { id: 1, name: "L1" },
    { id: 2, name: "L2" },
  ];

  const wallet =
    selectedLayer === 1 ? balanceData.wallet : balanceData[network];

  useEffect(() => {
    const tickers = Object.keys(api.currencies)
      .filter((c) => {
        return api.currencies[c].chain[network];
      })
      .sort();

    setTickers(tickers);
  }, [user.id, network]);

  const handleKeys = (e) => {
    if (~[32, 13, 27].indexOf(e.which)) {
      e.preventDefault();
      setShow(!show);
    }
  };
  window.onclick = function (event) {
    if (!event.target.matches("DropdownButton")) {
      if (show === true) {
        setShow(!show);
      }
    }
  };

  useEffect(() => {
    function handleWindowResize() {
      setWindowSize(getWindowSize());
    }

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  function getWindowSize() {
    const { innerWidth, innerHeight } = window;
    return { innerWidth, innerHeight };
  }

  return (
    <DropdownContainer
      onKeyDown={handleKeys}
      onClick={(e) => e.stopPropagation()}
      show={show}
      tabIndex="0"
    >
      <DropdownButton onClick={() => setShow(!show)} tabIndex="0">
        <AvatarImg
          src={profile.image != null ? profile.image : logo}
          alt={profile.name}
        />
        {profile.name}
        <AiOutlineCaretDown />
      </DropdownButton>
      <DropdownDisplay
        className={`${
          windowSize.innerWidth <= "960" ? "mobile-account-dropdown" : ""
        } `}
        show={show}
      >
        <DropdownHeader>
          <h3>Your Wallet</h3>
          <WalletToggle>
            {layers.map(({ id, name }) => (
              <WalletToggleItem
                key={id}
                onClick={() => setSelectedLayer(id)}
                selected={selectedLayer === id}
              >
                {name}
              </WalletToggleItem>
            ))}
          </WalletToggle>
        </DropdownHeader>
        <DropdownContent>
          {!wallet && (
            <LoaderContainer>
              <Loader type="TailSpin" color="#444" height={24} width={24} />
            </LoaderContainer>
          )}
          {wallet && (
            <CurrencyList>
              {tickers.map((ticker, key) => {
                if (!wallet[ticker] || wallet[ticker].value === 0) {
                  return null;
                }
                return (
                  <CurrencyListItem key={key}>
                    <img
                      className="currency-icon"
                      src={api.currencies[ticker].image.default}
                      alt={ticker}
                    />
                    <div>
                      <strong>
                        {selectedLayer === 2
                          ? wallet[ticker].valueReadable.toPrecision(6)
                          : wallet[ticker].valueReadable}{" "}
                        {ticker}
                      </strong>
                      <small>
                        $
                        {formatUSD(
                          coinEstimator(ticker) * wallet[ticker].valueReadable
                        )}
                      </small>
                    </div>
                  </CurrencyListItem>
                );
              })}
            </CurrencyList>
          )}
        </DropdownContent>
        <DropdownFooter>
          <SignOutButton onClick={() => api.disconnectWallet()}>
            <IoMdLogOut /> Disconnect
          </SignOutButton>
        </DropdownFooter>
      </DropdownDisplay>
    </DropdownContainer>
  );
};
