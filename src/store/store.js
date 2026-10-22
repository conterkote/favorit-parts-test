import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import partsReducer from '@Store/Slices/partsSlice/partsSlice'

export const createAppStore = () => configureStore({ reducer: { parts: partsReducer } })

const store = createAppStore()
export const useAppDispatch = useDispatch
export const useAppSelector = useSelector

export default store
