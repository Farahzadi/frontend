import React, { useMemo } from 'react'
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom'
import { networkConfigSelector } from 'lib/store/features/api/apiSlice';
import { BridgeTemplate } from 'components';
import Bridge from './Bridge/Bridge'
import BridgeReceipts from './BridgeReceipts/BridgeReceipts'
import BridgeIncompatible from './Bridge/BridgeIncompatible'
import './BridgePage.style.css'

export default function BridgePage() {
  const networkConfig = useSelector(networkConfigSelector);
  const network = networkConfig.name;
  
  const hasBridge = networkConfig.hasBridge;
  const isBridgeCompatible = useMemo(() => network && hasBridge, [network])
  const tab = useParams().tab || 'bridge'

  return (
    <BridgeTemplate>
      <div className="bridge_section">
          {isBridgeCompatible
            ? tab === 'bridge' ? <Bridge /> : <BridgeReceipts />
            : <BridgeIncompatible />}
      </div>
    </BridgeTemplate>
  )
}