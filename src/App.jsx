import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Desktop from './pages/Desktop';
import { ThemeProvider } from './lib/ThemeContext';

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Desktop />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
