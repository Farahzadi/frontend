import { createContext } from 'react';

export const BGContext = createContext({
    isAnimated :false,
    setIsAnimated: () => {}
})