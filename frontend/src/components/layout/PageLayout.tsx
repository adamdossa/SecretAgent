import Header from './Header'
import Navigation from './Navigation'

interface PageLayoutProps {
  title: string
  children: React.ReactNode
  showBack?: boolean
  showNav?: boolean
  showLogout?: boolean
}

export default function PageLayout({
  title,
  children,
  showBack = false,
  showNav = true,
  showLogout = true,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-christmas-snow-white flex flex-col">
      <Header title={title} showBack={showBack} showLogout={showLogout} />
      <main className={`flex-1 px-4 py-6 max-w-lg mx-auto w-full ${showNav ? 'pb-20' : ''}`}>
        {children}
      </main>
      {showNav && <Navigation />}
    </div>
  )
}
