'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Calendar, Play, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'ダッシュボード', href: '/dashboard', icon: BookOpen },
  { name: '課題管理', href: '/assignments/new', icon: Calendar },
  { name: '授業視聴', href: '/lectures', icon: Play }
]

export function Navbar() {
  const pathname = usePathname()
  const { logout, loading } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Nana</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors',
                      isActive
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">アカウント</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">ログアウト</span>
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden border-t pt-2 pb-3">
          <div className="grid grid-cols-3 gap-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center py-2 px-3 rounded-md text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}