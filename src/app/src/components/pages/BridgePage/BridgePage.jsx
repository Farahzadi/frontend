import React, { useMemo } from 'react'
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom'
import { networkSelector } from 'lib/store/features/api/apiSlice';
import { BridgeTemplate } from 'components';
import api from 'lib/api';
import Bridge from './Bridge/Bridge'
import BridgeReceipts from './BridgeReceipts/BridgeReceipts'
import BridgeIncompatible from './Bridge/BridgeIncompatible'
import './BridgePage.style.css'

export default function BridgePage() {
  const network = useSelector(networkSelector);
  const isBridgeCompatible = useMemo(() => network && api.isImplemented('depositL2'), [network])
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