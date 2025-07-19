import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mmnifzdktkcynqiuehud.supabase.co'
// 주의: 이 스크립트는 서비스 역할 키가 필요합니다
// .env 파일에 SUPABASE_SERVICE_ROLE_KEY를 설정하거나 
// 직접 입력해야 합니다 (보안에 주의)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'SERVICE_ROLE_KEY_NEEDED'

console.log('서비스 역할 키 확인:', serviceRoleKey.substring(0, 20) + '...')

if (serviceRoleKey === 'SERVICE_ROLE_KEY_NEEDED') {
  console.error('❌ 서비스 역할 키가 필요합니다!')
  console.error('SUPABASE_SERVICE_ROLE_KEY 환경변수를 설정하거나')
  console.error('Supabase 대시보드에서 직접 버킷을 생성해주세요.')
  console.error('')
  console.error('대시보드 방법:')
  console.error('1. https://supabase.com/dashboard 접속')
  console.error('2. Storage > Buckets 메뉴')
  console.error('3. "public" 버킷 생성 (Public 체크)')
  console.error('4. File size limit: 5242880 (5MB)')
  console.error('5. MIME types: image/jpeg,image/png,image/gif,image/webp')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupStorageWithAdmin() {
  console.log('=== Supabase Storage 관리자 설정 ===\n')
  
  try {
    // 1. 현재 버킷 목록 확인
    console.log('1. 현재 버킷 목록 확인:')
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('버킷 목록 조회 실패:', listError)
      return
    }
    
    console.log('기존 버킷:', existingBuckets.map(b => b.name).join(', ') || '없음')
    
    // 2. 'public' 버킷 생성
    console.log('\n2. public 버킷 생성:')
    const publicExists = existingBuckets.find(b => b.name === 'public')
    
    if (publicExists) {
      console.log('✅ public 버킷이 이미 존재합니다')
    } else {
      const { data: publicBucket, error: publicError } = await supabase.storage
        .createBucket('public', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        })
      
      if (publicError) {
        console.error('❌ public 버킷 생성 실패:', publicError)
      } else {
        console.log('✅ public 버킷 생성 성공')
      }
    }
    
    // 3. RLS 정책 설정
    console.log('\n3. RLS 정책 설정:')
    
    const policies = [
      {
        name: 'authenticated_users_can_upload_to_public',
        sql: `
          CREATE POLICY IF NOT EXISTS "authenticated_users_can_upload_to_public" 
          ON storage.objects FOR INSERT TO authenticated
          WITH CHECK (bucket_id = 'public');
        `
      },
      {
        name: 'anyone_can_read_public_bucket',
        sql: `
          CREATE POLICY IF NOT EXISTS "anyone_can_read_public_bucket" 
          ON storage.objects FOR SELECT TO public
          USING (bucket_id = 'public');
        `
      },
      {
        name: 'authenticated_users_can_delete_own_files',
        sql: `
          CREATE POLICY IF NOT EXISTS "authenticated_users_can_delete_own_files" 
          ON storage.objects FOR DELETE TO authenticated
          USING (bucket_id = 'public' AND auth.uid()::text = owner);
        `
      },
      {
        name: 'authenticated_users_can_update_own_files',
        sql: `
          CREATE POLICY IF NOT EXISTS "authenticated_users_can_update_own_files" 
          ON storage.objects FOR UPDATE TO authenticated
          USING (bucket_id = 'public' AND auth.uid()::text = owner);
        `
      }
    ]
    
    for (const policy of policies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy.sql })
        if (error) {
          console.error(`❌ 정책 ${policy.name} 생성 실패:`, error)
        } else {
          console.log(`✅ 정책 ${policy.name} 설정 완료`)
        }
      } catch (err) {
        // SQL 직접 실행이 안되는 경우
        console.log(`⚠️ 정책 ${policy.name}은 수동으로 설정 필요:`)
        console.log(policy.sql)
      }
    }
    
    // 4. 테스트 업로드
    console.log('\n4. 테스트 업로드:')
    
    // 작은 이미지 데이터 생성 (1x1 PNG)
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    const imageBuffer = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0))
    const testFile = new File([imageBuffer], 'test.png', { type: 'image/png' })
    
    const { data: testUpload, error: testError } = await supabase.storage
      .from('public')
      .upload('images/setup-test.png', testFile, { upsert: true })
    
    if (testError) {
      console.error('❌ 테스트 업로드 실패:', testError)
    } else {
      console.log('✅ 테스트 업로드 성공')
      const { data: testUrl } = supabase.storage
        .from('public')
        .getPublicUrl('images/setup-test.png')
      console.log('테스트 URL:', testUrl.publicUrl)
    }
    
    // 5. 최종 상태 확인
    console.log('\n5. 최종 상태 확인:')
    const { data: finalBuckets } = await supabase.storage.listBuckets()
    console.log('설정된 버킷들:')
    finalBuckets.forEach(bucket => {
      console.log(`- ${bucket.name} (public: ${bucket.public})`)
    })
    
    console.log('\n=== 설정 완료 ===')
    console.log('ImageUpload와 RichTextEditor가 정상 작동할 것입니다!')
    
  } catch (error) {
    console.error('설정 중 오류 발생:', error)
  }
}

setupStorageWithAdmin()