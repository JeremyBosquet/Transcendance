import { configureStore } from '@reduxjs/toolkit'
import chatReducer from './chatSlice'
import authReducer from './userSlice'
import gameReducer from './gameSlice'

export default configureStore({
  reducer: {
    chat: chatReducer,
    auth: authReducer,
    game: gameReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ 
    serializableCheck: false 
  }),
})