'use client'

import React, { useState, useEffect } from 'react'
import { storeApi, therapistApi, userApi, appointmentApi } from '@/lib/api'

export default function TestAPIPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    testAllAPIs()
  }, [])

  const testAllAPIs = async () => {
    setLoading(true)
    const testResults: any = {}

    try {
      // Test stores API
      console.log('Testing stores API...')
      const storesResponse = await storeApi.list()
      testResults.stores = {
        success: true,
        data: storesResponse.data,
        count: storesResponse.data?.stores?.length || storesResponse.data?.length || 0
      }
    } catch (error) {
      testResults.stores = { success: false, error: error.message }
    }

    try {
      // Test therapists API
      console.log('Testing therapists API...')
      const therapistsResponse = await therapistApi.list()
      testResults.therapists = {
        success: true,
        data: therapistsResponse.data,
        count: therapistsResponse.data?.therapists?.length || therapistsResponse.data?.length || 0
      }
    } catch (error) {
      testResults.therapists = { success: false, error: error.message }
    }

    try {
      // Test users API
      console.log('Testing users API...')
      const usersResponse = await userApi.list()
      testResults.users = {
        success: true,
        data: usersResponse.data,
        count: usersResponse.data?.users?.length || usersResponse.data?.length || 0
      }
    } catch (error) {
      testResults.users = { success: false, error: error.message }
    }

    try {
      // Test appointments API
      console.log('Testing appointments API...')
      const appointmentsResponse = await appointmentApi.list()
      testResults.appointments = {
        success: true,
        data: appointmentsResponse.data,
        count: appointmentsResponse.data?.appointments?.length || appointmentsResponse.data?.length || 0
      }
    } catch (error) {
      testResults.appointments = { success: false, error: error.message }
    }

    setResults(testResults)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">API 连接测试</h1>
        <div className="animate-pulse">正在测试API连接...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">API 连接测试结果</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(results).map(([apiName, result]: [string, any]) => (
          <div key={apiName} className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4 capitalize">{apiName} API</h2>
            
            {result.success ? (
              <div className="text-green-600">
                <div className="mb-2">✅ 连接成功</div>
                <div className="text-sm text-gray-600">
                  数据数量: {result.count}
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600">查看原始数据</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="text-red-600">
                <div className="mb-2">❌ 连接失败</div>
                <div className="text-sm">{result.error}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8">
        <button 
          onClick={testAllAPIs}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          重新测试
        </button>
      </div>
    </div>
  )
}