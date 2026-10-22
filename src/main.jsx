import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App.jsx'
import store from '@Store'
import '@fontsource-variable/golos-text'
import './index.css'

const root = document.getElementById('root')

if (!root) throw new Error('Корневой элемент приложения не найден.')

createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
