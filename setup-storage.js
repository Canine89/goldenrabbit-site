import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mmnifzdktkcynqiuehud.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbmlmemRrdGtjeW5xaXVlaHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDgyOTQsImV4cCI6MjA2ODQyNDI5NH0.-UA8kgiqX2-e1OWMoaipicLlhCWty--2wpiHR2zveCA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupStorage() {
  console.log('=== Supabase Storage 설정 ===\n')
  
  try {
    // 1. 'public' 버킷 생성 (ImageUpload 컴포넌트용)
    console.log('1. public 버킷 생성 중...')
    const { data: publicBucket, error: publicError } = await supabase.storage
      .createBucket('public', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      })
    
    if (publicError) {
      if (publicError.message.includes('already exists')) {
        console.log('✅ public 버킷이 이미 존재합니다')
      } else {
        console.error('❌ public 버킷 생성 실패:', publicError)
      }
    } else {
      console.log('✅ public 버킷 생성 성공:', publicBucket)
    }
    
    // 2. 'images' 버킷 생성 (RichTextEditor 컴포넌트용)
    console.log('\n2. images 버킷 생성 중...')
    const { data: imagesBucket, error: imagesError } = await supabase.storage
      .createBucket('images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      })
    
    if (imagesError) {
      if (imagesError.message.includes('already exists')) {
        console.log('✅ images 버킷이 이미 존재합니다')
      } else {
        console.error('❌ images 버킷 생성 실패:', imagesError)
      }
    } else {
      console.log('✅ images 버킷 생성 성공:', imagesBucket)
    }
    
    console.log('\n' + '='.repeat(50) + '\n')
    
    // 3. 버킷 목록 재확인
    console.log('3. 버킷 목록 재확인:')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('버킷 목록 조회 실패:', bucketsError)
    } else {
      console.log('현재 버킷 목록:')
      buckets.forEach(bucket => {
        console.log(`- ${bucket.name} (public: ${bucket.public}, created: ${bucket.created_at})`)
      })
    }
    
    console.log('\n' + '='.repeat(50) + '\n')
    
    // 4. 테스트 업로드
    console.log('4. 테스트 업로드 수행:')
    
    // 작은 이미지 데이터 생성 (1x1 PNG)
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    const imageBuffer = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0))
    const testFile = new File([imageBuffer], 'test.png', { type: 'image/png' })
    
    // public 버킷 테스트
    console.log('public 버킷에 테스트 이미지 업로드...')
    const { data: publicUpload, error: publicUploadError } = await supabase.storage
      .from('public')
      .upload('images/test-public.png', testFile, { upsert: true })
    
    if (publicUploadError) {
      console.error('❌ public 버킷 업로드 실패:', publicUploadError)
    } else {
      console.log('✅ public 버킷 업로드 성공')
      const { data: publicUrl } = supabase.storage
        .from('public')
        .getPublicUrl('images/test-public.png')
      console.log('Public URL:', publicUrl.publicUrl)
    }
    
    // images 버킷 테스트
    console.log('\nimages 버킷에 테스트 이미지 업로드...')
    const { data: imagesUpload, error: imagesUploadError } = await supabase.storage
      .from('images')
      .upload('images/test-images.png', testFile, { upsert: true })
    
    if (imagesUploadError) {
      console.error('❌ images 버킷 업로드 실패:', imagesUploadError)
    } else {
      console.log('✅ images 버킷 업로드 성공')
      const { data: imagesUrl } = supabase.storage
        .from('images')
        .getPublicUrl('images/test-images.png')
      console.log('Images URL:', imagesUrl.publicUrl)
    }
    
    console.log('\n' + '='.repeat(50) + '\n')
    
    // 5. RichTextEditor 방식으로 테스트
    console.log('5. RichTextEditor 방식 테스트:')
    console.log('RichTextEditor는 images 버킷에 images/ 폴더를 사용합니다')
    
    const richTextTestPath = 'images/richtext-test.png'
    const { data: richTextUpload, error: richTextError } = await supabase.storage
      .from('images')
      .upload(richTextTestPath, testFile, { upsert: true })
    
    if (richTextError) {
      console.error('❌ RichTextEditor 방식 업로드 실패:', richTextError)
    } else {
      console.log('✅ RichTextEditor 방식 업로드 성공')
      const { data: richTextUrl } = supabase.storage
        .from('images')
        .getPublicUrl(richTextTestPath)
      console.log('RichTextEditor URL:', richTextUrl.publicUrl)
      
      // URL 형식 분석
      console.log('\nURL 분석:')
      console.log('- 버킷: images')
      console.log('- 경로:', richTextTestPath)
      console.log('- 최종 URL:', richTextUrl.publicUrl)
      console.log('- URL에서 images가 중복되는지 확인:', richTextUrl.publicUrl.includes('/images/images/') ? '❌ 중복됨' : '✅ 정상')
    }
    
    console.log('\n=== 설정 완료 ===')
    console.log('이제 ImageUpload와 RichTextEditor 모두 정상 작동할 것입니다.')
    
  } catch (error) {
    console.error('설정 중 오류 발생:', error)
  }
}

setupStorage()