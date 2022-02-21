import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from 'redux'

import authReducer from "./slices/authSlice";
import counterReducer from './slices/couterSlice'

import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import localforage from "localforage";
import storage from 'redux-persist/lib/storage'


const rootReducer = combineReducers({
  auth: authReducer,
  counter:counterReducer,
});



const persistConfig = {
  key: "root",
  storage:localforage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export let persistor = persistStore(store);

// export const store = configureStore({
//   reducer: {
//       auth:authReducer,
//   },
// })

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
