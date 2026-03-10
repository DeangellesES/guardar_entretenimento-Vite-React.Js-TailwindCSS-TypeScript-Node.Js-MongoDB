import AppRoutes from './routes';

import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#020749',
            color: '#fff',
          },
        }}
      />
      <AppRoutes />
    </>
  )
}

export default App
