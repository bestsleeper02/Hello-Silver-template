/**
 * 노인복지 사이트 전용 localStorage 관리 시스템
 * 작성일: 2025년 7월
 * 목적: 사용자 편의성 향상을 위한 데이터 임시 저장
 */

// ===== 1. 메인 저장소 관리 객체 =====
const SiteStorage = {
    // 저장할 데이터 종류별 키 이름 정의
    KEYS: {
        USER_INFO: 'elderSite_userInfo',        // 사용자 기본정보
        WELFARE_DATA: 'elderSite_welfareData',  // 복지점수 계산 데이터  
        FORM_DATA: 'elderSite_formData',        // 폼 입력 임시 데이터
        SETTINGS: 'elderSite_settings'          // 사용자 설정
    },

    // ===== 2. 기본 저장/불러오기 함수 =====
    
    // 데이터 저장하기
    save: function(키이름, 저장할데이터) {
        try {
            localStorage.setItem(키이름, JSON.stringify(저장할데이터));
            console.log('데이터가 저장되었습니다:', 키이름);
            return true;
        } catch (error) {
            console.log('저장 실패:', error);
            return false;
        }
    },

    // 데이터 불러오기
    load: function(키이름) {
        try {
            const 저장된데이터 = localStorage.getItem(키이름);
            if (저장된데이터) {
                return JSON.parse(저장된데이터);
            } else {
                return null; // 저장된 데이터가 없으면 null 반환
            }
        } catch (error) {
            console.log('불러오기 실패:', error);
            return null;
        }
    },

    // 데이터 삭제하기
    remove: function(키이름) {
        try {
            localStorage.removeItem(키이름);
            console.log('데이터가 삭제되었습니다:', 키이름);
            return true;
        } catch (error) {
            console.log('삭제 실패:', error);
            return false;
        }
    },

    // ===== 3. 사용자 기본정보 관리 함수들 =====
    
    // 사용자 정보 저장 (이름, 전화번호, 주소 등)
    saveUserInfo: function(사용자정보) {
        const 저장할데이터 = {
            ...사용자정보,
            저장시간: new Date().toLocaleString()
        };
        return this.save(this.KEYS.USER_INFO, 저장할데이터);
    },

    // 사용자 정보 불러오기
    getUserInfo: function() {
        return this.load(this.KEYS.USER_INFO);
    },

    // ===== 4. 복지점수 계산 데이터 관리 =====
    
    // 복지점수 계산 결과 저장
    saveWelfareData: function(복지데이터) {
        const 저장할데이터 = {
            ...복지데이터,
            계산시간: new Date().toLocaleString()
        };
        return this.save(this.KEYS.WELFARE_DATA, 저장할데이터);
    },

    // 복지점수 데이터 불러오기
    getWelfareData: function() {
        return this.load(this.KEYS.WELFARE_DATA);
    },

    // ===== 5. 폼 입력 임시 저장 (가장 중요한 기능!) =====
    
    // 특정 페이지의 폼 데이터 저장
    saveFormData: function(페이지이름, 폼데이터) {
        // 모든 페이지의 폼 데이터를 가져오기
        const 모든폼데이터 = this.load(this.KEYS.FORM_DATA) || {};
        
        // 현재 페이지 데이터 추가/업데이트
        모든폼데이터[페이지이름] = {
            ...폼데이터,
            저장시간: new Date().toLocaleString()
        };
        
        return this.save(this.KEYS.FORM_DATA, 모든폼데이터);
    },

    // 특정 페이지의 폼 데이터 불러오기
    getFormData: function(페이지이름) {
        const 모든폼데이터 = this.load(this.KEYS.FORM_DATA) || {};
        return 모든폼데이터[페이지이름] || null;
    },

    // 폼 데이터 삭제 (제출 완료 후)
    clearFormData: function(페이지이름) {
        const 모든폼데이터 = this.load(this.KEYS.FORM_DATA) || {};
        if (모든폼데이터[페이지이름]) {
            delete 모든폼데이터[페이지이름];
            return this.save(this.KEYS.FORM_DATA, 모든폼데이터);
        }
        return true;
    },

    // ===== 6. 전체 데이터 관리 =====
    
    // 모든 데이터 삭제
    clearAllData: function() {
        const 확인 = confirm('정말로 모든 저장된 정보를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.');
        if (확인) {
            Object.values(this.KEYS).forEach(키 => {
                this.remove(키);
            });
            alert('모든 데이터가 삭제되었습니다.');
            return true;
        }
        return false;
    }
};

// ===== 7. 자동 폼 저장 기능 =====
const AutoFormStorage = {
    
    // 자동 저장 기능 활성화
    enable: function(페이지이름) {
        // data-auto-save 속성이 있는 모든 폼 찾기
        const 폼들 = document.querySelectorAll('[data-auto-save]');
        
        폼들.forEach(폼 => {
            // 페이지 로드 시 저장된 데이터 복원
            this.restoreForm(폼, 페이지이름);
            
            // 입력할 때마다 자동 저장
            폼.addEventListener('input', (이벤트) => {
                if (이벤트.target.matches('input, select, textarea')) {
                    this.saveForm(폼, 페이지이름);
                }
            });
            
            // 폼 제출 시 임시 데이터 삭제
            폼.addEventListener('submit', () => {
                SiteStorage.clearFormData(페이지이름);
            });
        });
    },

    // 폼의 모든 입력값 저장
    saveForm: function(폼, 페이지이름) {
        const 폼데이터 = new FormData(폼);
        const 저장할데이터 = {};
        
        // FormData를 일반 객체로 변환
        for (let [이름, 값] of 폼데이터.entries()) {
            저장할데이터[이름] = 값;
        }
        
        SiteStorage.saveFormData(페이지이름, 저장할데이터);
    },

    // 저장된 데이터로 폼 복원
    restoreForm: function(폼, 페이지이름) {
        const 저장된데이터 = SiteStorage.getFormData(페이지이름);
        
        if (저장된데이터) {
            // 각 입력 필드에 저장된 값 넣기
            Object.keys(저장된데이터).forEach(필드이름 => {
                if (필드이름 !== '저장시간') {
                    const 입력필드 = 폼.querySelector(`[name="${필드이름}"]`);
                    if (입력필드) {
                        입력필드.value = 저장된데이터[필드이름];
                    }
                }
            });
            
            // 복원 완료 알림 표시
            this.showRestoreMessage();
        }
    },

    // 복원 완료 알림 메시지
    showRestoreMessage: function() {
        const 알림창 = document.createElement('div');
        알림창.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 15px 20px;
            border-radius: 10px;
            border: 2px solid #c3e6cb;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            font-size: 16px;
            font-weight: bold;
            max-width: 350px;
            line-height: 1.4;
        `;
        알림창.innerHTML = `
            <div style="margin-bottom: 8px;">📝 이전에 입력하신 내용을 불러왔습니다!</div>
            <div style="font-size: 14px; font-weight: normal; color: #0f5132;">
                계속 작성하시거나 새로 시작하세요.
            </div>
        `;
        
        document.body.appendChild(알림창);
        
        // 4초 후 알림창 자동 제거
        setTimeout(() => {
            if (알림창.parentNode) {
                알림창.parentNode.removeChild(알림창);
            }
        }, 4000);
    }
};

// ===== 8. 페이지 로드 시 자동 실행 =====
document.addEventListener('DOMContentLoaded', function() {
    // 현재 페이지 이름 추출 (파일명에서)
    const 전체경로 = window.location.pathname;
    const 파일명 = 전체경로.split('/').pop();
    const 페이지이름 = 파일명.replace('.html', '') || 'index';
    
    console.log('현재 페이지:', 페이지이름);
    
    // 자동 폼 저장 기능 활성화
    AutoFormStorage.enable(페이지이름);
    
    console.log('localStorage 시스템이 준비되었습니다!');
});

// ===== 9. 전역에서 사용할 수 있도록 설정 =====
window.SiteStorage = SiteStorage;
window.AutoFormStorage = AutoFormStorage;

console.log('storage.js 파일이 로드되었습니다!');
