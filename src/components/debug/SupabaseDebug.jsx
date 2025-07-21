import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const SupabaseDebug = () => {
  const { user } = useAuth()
  const [testResults, setTestResults] = useState({})
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const results = {}

    try {
      // 1. 기본 연결 테스트
      console.log('🔍 1. Supabase 기본 연결 테스트...')
      const { data: healthCheck, error: healthError } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true })
      
      results.connectionTest = {
        success: !healthError,
        data: healthCheck,
        error: healthError?.message
      }

      // 2. 현재 사용자 세션 확인
      console.log('🔍 2. 현재 사용자 세션 확인...')
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      results.sessionTest = {
        success: !sessionError,
        hasUser: !!sessionData?.session?.user,
        userId: sessionData?.session?.user?.id,
        userEmail: sessionData?.session?.user?.email,
        error: sessionError?.message
      }

      // 3. profiles 테이블 직접 조회
      if (user?.id) {
        console.log('🔍 3. profiles 테이블 직접 조회...')
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        results.profileQuery = {
          success: !profileError,
          data: profileData,
          error: profileError?.message,
          errorCode: profileError?.code
        }
      }

      // 4. RLS 정책 테스트
      console.log('🔍 4. RLS 정책 테스트...')
      const { data: allProfiles, error: rlsError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .limit(1)

      results.rlsTest = {
        success: !rlsError,
        canReadProfiles: !!allProfiles,
        error: rlsError?.message,
        errorCode: rlsError?.code
      }

      // 5. 환경변수 확인
      results.envTest = {
        hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 
          `${import.meta.env.VITE_SUPABASE_URL.substring(0, 20)}...` : 'Missing',
        anonKeyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0
      }

    } catch (error) {
      console.error('❌ 테스트 실행 중 오류:', error)
      results.globalError = error.message
    }

    setTestResults(results)
    setLoading(false)
    console.log('🔍 전체 테스트 결과:', results)
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🔍 Supabase 연결 진단</h2>
      
      <button
        onClick={runTests}
        disabled={loading}
        className="mb-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? '테스트 실행 중...' : '진단 시작'}
      </button>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-4">
          {/* 연결 테스트 */}
          <div className={`p-4 rounded ${testResults.connectionTest?.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <h3 className="font-bold">1. 기본 연결 테스트</h3>
            <p>상태: {testResults.connectionTest?.success ? '✅ 성공' : '❌ 실패'}</p>
            {testResults.connectionTest?.error && (
              <p className="text-red-600">오류: {testResults.connectionTest.error}</p>
            )}
          </div>

          {/* 세션 테스트 */}
          <div className={`p-4 rounded ${testResults.sessionTest?.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <h3 className="font-bold">2. 사용자 세션</h3>
            <p>로그인 상태: {testResults.sessionTest?.hasUser ? '✅ 로그인됨' : '❌ 미로그인'}</p>
            <p>사용자 ID: {testResults.sessionTest?.userId || 'N/A'}</p>
            <p>이메일: {testResults.sessionTest?.userEmail || 'N/A'}</p>
          </div>

          {/* 프로필 쿼리 */}
          {testResults.profileQuery && (
            <div className={`p-4 rounded ${testResults.profileQuery?.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className="font-bold">3. 프로필 조회</h3>
              <p>상태: {testResults.profileQuery?.success ? '✅ 성공' : '❌ 실패'}</p>
              {testResults.profileQuery?.data && (
                <div className="mt-2">
                  <p>역할: {testResults.profileQuery.data.role}</p>
                  <p>이메일: {testResults.profileQuery.data.email}</p>
                </div>
              )}
              {testResults.profileQuery?.error && (
                <p className="text-red-600">오류 ({testResults.profileQuery.errorCode}): {testResults.profileQuery.error}</p>
              )}
            </div>
          )}

          {/* RLS 테스트 */}
          <div className={`p-4 rounded ${testResults.rlsTest?.success ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <h3 className="font-bold">4. RLS 정책 테스트</h3>
            <p>프로필 읽기: {testResults.rlsTest?.canReadProfiles ? '✅ 가능' : '⚠️ 제한됨'}</p>
            {testResults.rlsTest?.error && (
              <p className="text-orange-600">오류 ({testResults.rlsTest.errorCode}): {testResults.rlsTest.error}</p>
            )}
          </div>

          {/* 환경변수 */}
          <div className={`p-4 rounded ${testResults.envTest?.hasSupabaseUrl && testResults.envTest?.hasAnonKey ? 'bg-green-100' : 'bg-red-100'}`}>
            <h3 className="font-bold">5. 환경변수</h3>
            <p>Supabase URL: {testResults.envTest?.hasSupabaseUrl ? '✅' : '❌'} {testResults.envTest?.supabaseUrl}</p>
            <p>Anon Key: {testResults.envTest?.hasAnonKey ? '✅' : '❌'} (길이: {testResults.envTest?.anonKeyLength})</p>
          </div>

          {testResults.globalError && (
            <div className="p-4 rounded bg-red-100">
              <h3 className="font-bold">전역 오류</h3>
              <p className="text-red-600">{testResults.globalError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SupabaseDebug