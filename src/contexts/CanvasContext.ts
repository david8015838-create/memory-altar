import { createContext, useContext } from 'react'

/** 提供畫布目前縮放比例給子 widget，讓拖曳位移正確換算 */
export const CanvasScaleContext = createContext(1)
export const useCanvasScale = () => useContext(CanvasScaleContext)
