/**
 * Supabase 프로젝트 설정 및 초기화 스크립트
 * 
 * 보안 경고: 이 스크립트는 개발 환경에서만 사용하세요
 * Access Token은 관리자 권한을 가지고 있어 매우 위험합니다
 */

const ACCESS_TOKEN = 'sbp_6f91ddbcd6747c767d08685654d412ae97b7de31'

// Supabase 프로젝트 정보 가져오기
async function getSupabaseProjects() {
  try {
    console.log('🔍 Supabase 프로젝트 조회 중...')
    
    const response = await fetch('https://api.supabase.com/v1/projects', {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const projects = await response.json()
    
    if (projects.length === 0) {
      console.log('📝 프로젝트가 없습니다. 새 프로젝트를 생성해야 합니다.')
      return null
    }

    console.log('📋 사용 가능한 프로젝트들:')
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name} (${project.id})`)
      console.log(`   URL: https://${project.ref}.supabase.co`)
      console.log(`   상태: ${project.status}`)
      console.log(`   리전: ${project.region}`)
      console.log('---')
    })

    return projects
  } catch (error) {
    console.error('❌ 프로젝트 조회 실패:', error.message)
    return null
  }
}

// 새 프로젝트 생성
async function createSupabaseProject() {
  try {
    console.log('🚀 새 Supabase 프로젝트 생성 중...')
    
    const projectData = {
      name: 'goldenrabbit-site',
      organization_id: null, // 개인 계정
      plan: 'free',
      region: 'ap-northeast-1', // 서울 리전
      db_pass: 'goldenrabbit2024!', // 강력한 비밀번호
    }

    const response = await fetch('https://api.supabase.com/v1/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(projectData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`프로젝트 생성 실패: ${errorData.message}`)
    }

    const project = await response.json()
    console.log('✅ 프로젝트 생성 완료!')
    console.log(`프로젝트 ID: ${project.id}`)
    console.log(`프로젝트 URL: https://${project.ref}.supabase.co`)
    
    return project
  } catch (error) {
    console.error('❌ 프로젝트 생성 실패:', error.message)
    return null
  }
}

// 프로젝트 설정 정보 가져오기
async function getProjectConfig(projectRef) {
  try {
    console.log('🔧 프로젝트 설정 정보 조회 중...')
    
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const config = await response.json()
    return config
  } catch (error) {
    console.error('❌ 설정 조회 실패:', error.message)
    return null
  }
}

// .env 파일 업데이트
async function updateEnvFile(projectRef, anonKey) {
  const fs = require('fs')
  
  const envContent = `# Supabase 설정 - 자동 생성됨
VITE_SUPABASE_URL=https://${projectRef}.supabase.co
VITE_SUPABASE_ANON_KEY=${anonKey}

# 개발 전용 - 프로덕션에서는 제거하세요
# SUPABASE_ACCESS_TOKEN=${ACCESS_TOKEN}
`

  try {
    fs.writeFileSync('.env', envContent)
    console.log('✅ .env 파일 업데이트 완료!')
    console.log('🔒 보안 주의: ACCESS_TOKEN을 .env 파일에서 제거하는 것을 권장합니다')
  } catch (error) {
    console.error('❌ .env 파일 업데이트 실패:', error)
  }
}

// 메인 실행 함수
async function main() {
  console.log('🐰 골든래빗 Supabase 설정 시작...')
  console.log('=' * 50)
  
  // 기존 프로젝트 확인
  const existingProjects = await getSupabaseProjects()
  
  let selectedProject = null
  
  if (existingProjects && existingProjects.length > 0) {
    console.log('🤔 기존 프로젝트를 사용하시겠습니까? (첫 번째 프로젝트를 자동 선택)')
    selectedProject = existingProjects[0]
  } else {
    console.log('📝 새 프로젝트를 생성합니다...')
    selectedProject = await createSupabaseProject()
  }
  
  if (!selectedProject) {
    console.log('❌ 프로젝트 설정에 실패했습니다.')
    return
  }
  
  console.log(`✅ 선택된 프로젝트: ${selectedProject.name}`)
  console.log(`📍 프로젝트 URL: https://${selectedProject.ref}.supabase.co`)
  
  // 프로젝트 설정 정보 가져오기
  const config = await getProjectConfig(selectedProject.ref)
  
  if (config && config.api) {
    console.log('🔑 API 키 정보:')
    console.log(`- Anon Key: ${config.api.anon_key}`)
    console.log(`- Service Role Key: ${config.api.service_role_key}`)
    
    // .env 파일 업데이트
    await updateEnvFile(selectedProject.ref, config.api.anon_key)
  }
  
  console.log('=' * 50)
  console.log('🎉 Supabase 설정 완료!')
  console.log('')
  console.log('다음 단계:')
  console.log('1. Supabase 대시보드에서 SQL 에디터 열기')
  console.log('2. supabase-schema.sql 파일 내용 실행')
  console.log('3. sample-data.sql 파일 내용 실행')
  console.log('4. npm run dev 실행')
  console.log('')
  console.log('🔗 Supabase 대시보드: https://app.supabase.com/projects')
  console.log('🔗 프로젝트 직접 링크: https://app.supabase.com/project/' + selectedProject.ref)
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { getSupabaseProjects, createSupabaseProject, getProjectConfig, updateEnvFile }