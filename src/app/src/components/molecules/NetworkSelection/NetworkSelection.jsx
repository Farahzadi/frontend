import React, { useState, useEffect } from "react";
import { Dropdown } from "react-bootstrap";
import { GoGlobe } from "react-icons/go";
import { networkSelector } from "lib/store/features/api/apiSlice";
import { useSelector } from "react-redux";
import api from "lib/api";

const NetworkSelection = () => {
  const [netwokName, setNetwokName] = useState("test");

  const network = useSelector(networkSelector);
  const selectNetwork = (id) => {
    api.setAPIProvider(id);
    api.refreshNetwork().catch((err) => {
      console.log(err);
    });
    if (id === "zksync_goerli") {
      return setNetwokName("zkSync(V1) - Goerli");
    }
    setNetwokName("zkSync(V1) - Mainnet");
  };

  useEffect(() => {
    if (network === 1000) {
      return setNetwokName("zkSync(V1) - Goerli");
    }
    setNetwokName("zkSync(V1) - Mainnet");
  }, []);
  return (
    <>
      <Dropdown className=" mx-0 mx-md-5 newBtn">
        <Dropdown.Toggle>
          <GoGlobe className="eu_network" />  {netwokName}
        </Dropdown.Toggle>

        <Dropdown.Menu className="dropdown-menu "> 
          <Dropdown.Item
            onClick={() => {
              selectNetwork("zksyncv1_goerli");
            }}
          >
            zkSync(V1) - Goerli
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => {
              selectNetwork("zksyncv1");
            }}
          >
            zkSync(V1) - Mainnet
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </>
  );
};

export default NetworkSelection;
