import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import AppErrorBoundary from './components/system/AppErrorBoundary'

function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppErrorBoundary>
  )
}

export default App
