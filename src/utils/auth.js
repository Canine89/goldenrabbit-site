// 관리자 이메일 체크 함수
export const isAdminEmail = (email) => {
  const adminEmails = import.meta.env.VITE_ADMIN_EMAILS?.split(',') || []
  return adminEmails.includes(email)
}

// 관리자 이메일 목록 가져오기
export const getAdminEmails = () => {
  return import.meta.env.VITE_ADMIN_EMAILS?.split(',') || []
}

// 사용자 역할 결정
export const getUserRole = (email) => {
  return isAdminEmail(email) ? 'admin' : 'customer'
}

// 프로필 생성 데이터 생성
export const createProfileData = (user) => {
  return {
    id: user.id,
    email: user.email,
    username: user.user_metadata?.full_name || user.email,
    role: getUserRole(user.email)
  }
}