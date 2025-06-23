import Link from 'next/link'
import { User } from 'lucide-react'
import { SignupFormComponent } from '@/components/auth/signup-form'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-blue-600 rounded-full">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            新しいアカウントを作成
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            または{' '}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              既存のアカウントにログイン
            </Link>
          </p>
        </div>

        <SignupFormComponent />
      </div>
    </div>
  )
}
