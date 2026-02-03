import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

// Configure React Query for caching and background refetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // Data considered fresh for 2 minutes
      gcTime: 1000 * 60 * 10, // Cache garbage collected after 10 minutes
      refetchOnWindowFocus: true, // Refetch when window regains focus
      retry: 2, // Retry failed requests twice
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
