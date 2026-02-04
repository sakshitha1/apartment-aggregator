import { Navigate, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar.jsx'
import { AuthModal } from './components/auth/AuthModal.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { SearchResultsPage } from './pages/SearchResultsPage.jsx'
import { ListingDetailsPage } from './pages/ListingDetailsPage.jsx'
import { AddListingWizardPage } from './pages/AddListingWizardPage.jsx'
import { Footer } from './components/Footer.jsx'
import { RequireAuth } from './components/RequireAuth.jsx'

export default function App() {
  return (
    <div className="min-h-dvh bg-white">
      <Navbar />
      <AuthModal />

      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/listing/:id" element={<ListingDetailsPage />} />
          <Route
            path="/host/new"
            element={
              <RequireAuth>
                <AddListingWizardPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}
