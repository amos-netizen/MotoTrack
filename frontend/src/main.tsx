import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { initTheme } from './lib/theme'
import './index.css'
import App from './pages/App'
import Orders from './pages/Orders'
import Appointments from './pages/Appointments'
import Recommendation from './pages/Recommendation'
import Login from './pages/Login'
import Signup from './pages/Signup'
import SiteManager from './pages/SiteManager'
import Technician from './pages/Technician'
import WorkshopManager from './pages/WorkshopManager'
import WarehouseManager from './pages/WarehouseManager'
import Billing from './pages/Billing'
import TaskActions from './pages/TaskActions'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/orders', element: <Orders /> },
  { path: '/appointments', element: <Appointments /> },
  { path: '/recommendation', element: <Recommendation /> },
  { path: '/site-manager', element: <SiteManager /> },
  { path: '/technician', element: <Technician /> },
  { path: '/workshop-manager', element: <WorkshopManager /> },
  { path: '/warehouse-manager', element: <WarehouseManager /> },
  { path: '/billing', element: <Billing /> },
  { path: '/task-actions', element: <TaskActions /> },
])

initTheme()
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
