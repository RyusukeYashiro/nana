import Link from 'next/link'
import { User } from 'lucide-react'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-blue-600 rounded-full">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            アカウントにログイン
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            または{' '}
            <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              新しいアカウントを作成
            </Link>
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}