import React, { useMemo } from 'react'
import { useSelector } from 'react-redux';
import { networkConfigSelector } from 'lib/store/features/api/apiSlice';
import { DefaultTemplate } from 'components';
import Pool from './Pool/Pool.jsx'
import PoolIncompatible from './Pool/PoolIncompatible'
import './PoolPage.style.css'

export default function BridgePage() {
  const networkConfig = useSelector(networkConfigSelector);
  const network = networkConfig.name;

  const hasBridge = networkConfig.hasBridge;
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