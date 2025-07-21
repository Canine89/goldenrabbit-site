# Google Drive 권한 부여 기능

## 기능 개요

관리자가 교수회원 대기자를 [교수]로 승인할 때, Google Drive 자료실 폴더에 뷰어 권한을 부여할 수 있는 기능입니다.

## 사용자 시나리오

1. **관리자 로그인**: Google OAuth로 관리자 계정 로그인
2. **교수회원 선택**: 관리자 페이지에서 교수회원 대기 상태의 사용자 선택
3. **역할 변경 시도**: [교수]로 역할 변경 선택
4. **Drive 권한 부여**: 모달에서 원하는 자료실 폴더에 권한 부여
5. **승인 완료**: 역할 변경 및 권한 부여 완료

## 구현된 기능

### 1. Google Drive API 연동
```typescript
// OAuth 토큰으로 Drive API 호출
const grantDrivePermission = async (folderId: string, email: string) => {
  // Bearer token으로 Google Drive API 호출
  // 지정한 폴더에 이메일 계정을 뷰어로 추가
}
```

### 2. 역할 변경 모달 UI 확장
- **조건부 표시**: `newRole === 'professor' && selectedUser.professor_application_date`
- **폴더 목록**: IT전문서 자료실, 경제경영 자료실
- **개별 권한 부여**: 각 폴더별로 선택적 권한 부여 가능
- **상태 표시**: 권한 부여 진행 상태 및 완료 상태 표시

### 3. 상태 관리
- `driveFolders`: 각 폴더별 권한 부여 상태 추적
- `grantingPermission`: 권한 부여 진행 중 상태 관리
- 실시간 UI 업데이트

## 폴더 정보

현재 설정된 Google Drive 폴더 ID:

1. **폴더 1**: `1p1RcwJlrJbIVP7IOpmTfwrY1Eg2SKIsN`
2. **폴더 2**: `1nQNK776WO84RqCXhwC6reOVPvLojZE9Z`

**폴더 이름**: Google Drive API를 통해 실시간으로 가져옵니다.
- `fetchFolderInfo()` 함수로 실제 폴더 이름 조회
- API 호출 실패 시 폴더 ID 일부를 표시

## UI/UX 특징

### 모달 UI
- **선택적 표시**: 교수로 승인하는 경우에만 Drive 섹션 표시
- **동적 폴더 로딩**: 실제 폴더 이름을 API로 가져와서 표시
- **로딩 상태**: 폴더 정보 로딩 중 스피너 표시
- **폴더 아이콘**: 시각적 구분을 위한 폴더 아이콘
- **실시간 상태**: "처리중...", "✓ 권한 부여됨" 상태 표시
- **선택적 권한**: 필요한 폴더만 선택해서 권한 부여 가능

### 에러 처리
- OAuth 토큰 없음: "Google 액세스 토큰을 찾을 수 없습니다"
- API 호출 실패: Google Drive API 에러 메시지 표시
- 권한 부여 실패 시에도 역할 변경은 완료

## 필요 권한

### Google OAuth 스코프
현재 OAuth 설정에 다음 스코프가 포함되어야 합니다:
- `https://www.googleapis.com/auth/drive` (Drive 파일 관리)

### 관리자 계정 요구사항
- 두 Drive 폴더에 대한 편집 권한 필요
- Google OAuth로 로그인한 관리자 계정

## 향후 개선 가능사항

1. **배치 권한 부여**: 여러 폴더에 한번에 권한 부여
2. **권한 상태 확인**: 기존 권한 여부 사전 확인
3. **폴더 설정**: 관리자가 폴더 목록을 동적으로 관리
4. **권한 로그**: 권한 부여 이력 테이블 추가
5. **권한 제거**: 교수 권한 취소 시 Drive 권한도 제거

## 보안 고려사항

- OAuth 토큰은 세션에서만 사용, 저장하지 않음
- API 호출 실패 시 적절한 에러 처리
- 권한 부여는 뷰어(읽기 전용)로 제한
- 관리자 권한이 있는 계정만 접근 가능