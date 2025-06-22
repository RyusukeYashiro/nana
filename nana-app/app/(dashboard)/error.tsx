'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-red-500">
            <AlertTriangle className="h-full w-full" />
          </div>
          <CardTitle>エラーが発生しました</CardTitle>
          <CardDescription>
            申し訳ございませんが、問題が発生しました。
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-2 text-xs">
                <summary>詳細</summary>
                <pre className="mt-2 text-left overflow-auto">
                  {error.message}
                </pre>
              </details>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={reset} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            再試行
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}