import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './tokens.css'
import './styles.css'
import App from './App'

const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
)

const root = document.getElementById('root')
if (root.querySelector('*')) ReactDOM.hydrateRoot(root, app)
else ReactDOM.createRoot(root).render(app)
