import { useSelector } from "react-redux";
import {
  arweaveAllocationSelector,
  userChainDetailsSelector,
  userAddressSelector,
} from "../../../lib/store/features/api/apiSlice";
import React, { useEffect, useState } from "react";
import { Modal } from "../../atoms/Modal";
import Pane from "../../atoms/Pane/Pane";
import { FaEquals, FaTimes, FaMinus } from "react-icons/all";
import Submit from "../../atoms/Form/Submit";
import Form from "../../atoms/Form/Form";
import { x } from "@xstyled/styled-components";
import { toast } from "react-toastify";
import Core from "lib/api/Core";

const AllocationModal = ({ onClose, show, onSuccess, bytesToPurchase }) => {
  const userAddress = useSelector(userAddressSelector);
  const arweaveAllocation = Number(useSelector(arweaveAllocationSelector));
  const userChainDetails = useSelector(userChainDetailsSelector);
  const L1Balances = userChainDetails.L1Balances;

  const arweaveAllocationKB = arweaveAllocation / 1000;
  const userHasExistingAllocation = arweaveAllocation !== 0;
  const fileSizeKB = bytesToPurchase / 1000;
  const pricePerKB = 0.001;

  const [totalPrice, setTotalPrice] = useState(fileSizeKB * pricePerKB);
  const [isUSDCBalanceSufficient, setIsUSDCBalanceSufficient] = useState(false);

  useEffect(() => Core.run("updateUserBalancesState"), []);

  useEffect(() => {
    if (userAddress) {
      Core.run("refreshArweaveAllocation", userAddress);
      const kbToPurchase = Number((bytesToPurchase - arweaveAllocation) / 1000);
      setTotalPrice(kbToPurchase * pricePerKB);
      if (totalPrice) {
        let usdcBalance = 0;
        const feeCurrency = "USDC";
        if ((L1Balances[feeCurrency]?.valueReadable ?? 0) > 0) {
          usdcBalance = Number(L1Balances[feeCurrency]?.valueReadable);
        }

        if (totalPrice > usdcBalance) {
          setIsUSDCBalanceSufficient(false);
        } else {
          setIsUSDCBalanceSufficient(true);
        }
      }
    }

    //@TODO: remove jsonify here, add better dep
  }, [bytesToPurchase, userAddress, arweaveAllocation, L1Balances]);

  return (
    <Modal title={"Purchase Arweave Allocation"} show={show} onClose={onClose}>
      <x.div fontSize={14}>
        ZigZag enables permissionless pair listings by storing your pair's metadata on Arweave. You must purchase space
        on Arweave first.
      </x.div>
      <Pane size={"xs"} my={8}>
        <x.div display={"flex"} justifyContent={"space-around"} alignItems={"center"}>
          {userHasExistingAllocation ? (
            <x.div display={"flex"} alignItems={"center"}>
              <x.div fontSize={28} mr={3}>
                (
              </x.div>
              <AllocationItem label={"file size"}>{fileSizeKB} kB</AllocationItem>
              <FaMinus size={18} style={{ margin: "0px 10px" }} />
              <AllocationItem label={"existing"}>{arweaveAllocationKB} kB</AllocationItem>
              <x.div fontSize={28} ml={3}>
                )
              </x.div>
            </x.div>
          ) : (
            <AllocationItem label={"file size"}>{fileSizeKB} kB</AllocationItem>
          )}
          <FaTimes size={18} />
          <AllocationItem label={"$/kB"}>${pricePerKB}</AllocationItem>
          <FaEquals size={18} />
          <AllocationItem label={"total price"}>~${totalPrice.toPrecision(2)}</AllocationItem>
        </x.div>
      </Pane>

      <Form
        onSubmit={async () => {
          try {
            const transaction = await Core.run("purchaseArweaveBytes", bytesToPurchase);
            await transaction.awaitReceipt();
            await onSuccess();
          } catch (e) {
            console.error("Error purchasing arweave bytes", e);
            toast.error("Transaction was rejected");
          }
        }}>
        <Submit block isDisabled={!isUSDCBalanceSufficient}>
          {isUSDCBalanceSufficient ? "PURCHASE" : "INSUFFICIENT USDC WALLET BALANCE"}
        </Submit>
      </Form>
    </Modal>
  );
};

const AllocationItem = ({ label, children }) => {
  return (
    <x.div display={"flex"} flexDirection={"column"} alignItems={"center"}>
      <x.div fontSize={20}>{children}</x.div>
      <x.div fontSize={12}>{label}</x.div>
    </x.div>
  );
};

export default AllocationModal;
