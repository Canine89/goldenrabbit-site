import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mmnifzdktkcynqiuehud.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbmlmemRrdGtjeW5xaXVlaHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDgyOTQsImV4cCI6MjA2ODQyNDI5NH0.-UA8kgiqX2-e1OWMoaipicLlhCWty--2wpiHR2zveCA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkStorage() {
  console.log('=== Supabase Storage 상태 확인 ===\n')
  
  try {
    // 1. 버킷 목록 조회
    console.log('1. 버킷 목록 조회:')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('버킷 목록 조회 실패:', bucketsError)
    } else {
      console.log('버킷 목록:', buckets)
      console.log('버킷 개수:', buckets.length)
      buckets.forEach(bucket => {
        console.log(`- ${bucket.name} (public: ${bucket.public}, created: ${bucket.created_at})`)
      })
    }
    
    console.log('\n' + '='.repeat(50) + '\n')
    
    // 2. 'images' 버킷 확인
    console.log('2. images 버킷 상세 확인:')
    const imagesExists = buckets?.find(bucket => bucket.name === 'images')
    if (imagesExists) {
      console.log('✅ images 버킷이 존재합니다')
      console.log('설정:', imagesExists)
      
      // images 버킷의 파일 목록 확인
      try {
        const { data: files, error: filesError } = await supabase.storage
          .from('images')
          .list('', { limit: 10 })
        
        if (filesError) {
          console.error('images 버킷 파일 목록 조회 실패:', filesError)
        } else {
          console.log('images 버킷 파일 개수:', files.length)
          if (files.length > 0) {
            console.log('최근 파일들:')
            files.slice(0, 5).forEach(file => {
              console.log(`- ${file.name} (크기: ${file.metadata?.size || 'unknown'})`)
            })
          }
        }
      } catch (err) {
        console.error('파일 목록 조회 중 오류:', err)
      }
    } else {
      console.log('❌ images 버킷이 존재하지 않습니다')
    }
    
    console.log('\n' + '='.repeat(50) + '\n')
    
    // 3. 'public' 버킷 확인 (ImageUpload에서 사용)
    console.log('3. public 버킷 상세 확인:')
    const publicExists = buckets?.find(bucket => bucket.name === 'public')
    if (publicExists) {
      console.log('✅ public 버킷이 존재합니다')
      console.log('설정:', publicExists)
      
      // public/images 폴더 확인
      try {
        const { data: files, error: filesError } = await supabase.storage
          .from('public')
          .list('images', { limit: 10 })
        
        if (filesError) {
          console.error('public/images 폴더 조회 실패:', filesError)
        } else {
          console.log('public/images 폴더 파일 개수:', files.length)
          if (files.length > 0) {
            console.log('최근 파일들:')
            files.slice(0, 5).forEach(file => {
              console.log(`- ${file.name} (크기: ${file.metadata?.size || 'unknown'})`)
            })
          }
        }
      } catch (err) {
        console.error('public/images 폴더 조회 중 오류:', err)
      }
    } else {
      console.log('❌ public 버킷이 존재하지 않습니다')
    }
    
    console.log('\n' + '='.repeat(50) + '\n')
    
    // 4. 테스트 업로드 시도
    console.log('4. 테스트 업로드 시도:')
    
    // 작은 테스트 파일 생성
    const testContent = 'test image content'
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' })
    
    // images 버킷에 업로드 시도
    if (imagesExists) {
      console.log('images 버킷에 테스트 파일 업로드 시도...')
      const { data: uploadData1, error: uploadError1 } = await supabase.storage
        .from('images')
        .upload('test/test1.txt', testFile, { upsert: true })
      
      if (uploadError1) {
        console.error('images 버킷 업로드 실패:', uploadError1)
      } else {
        console.log('✅ images 버킷 업로드 성공:', uploadData1)
        
        // URL 생성 테스트
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl('test/test1.txt')
        console.log('생성된 URL:', urlData.publicUrl)
      }
    }
    
    // public 버킷에 업로드 시도
    if (publicExists) {
      console.log('public 버킷에 테스트 파일 업로드 시도...')
      const { data: uploadData2, error: uploadError2 } = await supabase.storage
        .from('public')
        .upload('images/test2.txt', testFile, { upsert: true })
      
      if (uploadError2) {
        console.error('public 버킷 업로드 실패:', uploadError2)
      } else {
        console.log('✅ public 버킷 업로드 성공:', uploadData2)
        
        // URL 생성 테스트
        const { data: urlData } = supabase.storage
          .from('public')
          .getPublicUrl('images/test2.txt')
        console.log('생성된 URL:', urlData.publicUrl)
      }
    }
    
  } catch (error) {
    console.error('전체 작업 중 오류 발생:', error)
  }
}

checkStorage()