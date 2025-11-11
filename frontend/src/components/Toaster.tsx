import { Toaster as HotToaster } from 'react-hot-toast'

export default function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(31, 40, 51, 0.95)',
          backdropFilter: 'blur(20px)',
          color: '#C5C6C7',
          border: '1px solid rgba(102, 252, 241, 0.3)',
          borderRadius: '1rem',
          padding: '1rem 1.5rem',
          fontFamily: 'Poppins, sans-serif',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(102, 252, 241, 0.2)',
        },
        success: {
          iconTheme: {
            primary: '#66FCF1',
            secondary: '#0B0C10',
          },
          style: {
            border: '1px solid rgba(102, 252, 241, 0.5)',
          },
        },
        error: {
          iconTheme: {
            primary: '#f87171',
            secondary: '#0B0C10',
          },
          style: {
            border: '1px solid rgba(239, 68, 68, 0.5)',
          },
        },
      }}
    />
  )
}

