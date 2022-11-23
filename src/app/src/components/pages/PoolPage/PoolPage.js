import React, { useMemo } from 'react'
import { useSelector } from 'react-redux';
import { networkSelector } from 'lib/store/features/api/apiSlice';
import { DefaultTemplate } from 'components';
import Pool from './Pool/Pool.jsx'
import PoolIncompatible from './Pool/PoolIncompatible'
import './PoolPage.style.css'

export default function BridgePage() {
  const network = useSelector(networkSelector);
  const hasBridge = ["zksyncv1", "zksyncv1_goerli"].includes(network);
  const isPoolCompatible = useMemo(() => network && hasBridge, [network])

  return (
    <DefaultTemplate>
      <div className="pool_section">
        <div className="pool_container" style={{ flex: '1 1 auto' }}>
          {isPoolCompatible ? <Pool />
            : <PoolIncompatible />}
        </div>
      </div>
    </DefaultTemplate>
  )
}