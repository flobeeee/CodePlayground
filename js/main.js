// 메인 애플리케이션 클래스
class App {
    constructor() {
        this.currentPage = 'home';
        this.pageContent = document.getElementById('pageContent');
        this.sidebarManager = null;
        this.fileManager = null;
        
        this.init();
    }
    
    async init() {
        // 사이드바 매니저 초기화
        this.sidebarManager = new SidebarManager();
        
        // 파일 매니저 초기화
        this.fileManager = new FileManager();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 초기 페이지 로드
        await this.loadPage('home');
        
        // 클릭 가능한 텍스트 이벤트 설정
        this.setupClickableTexts();
        
        console.log('애플리케이션이 성공적으로 초기화되었습니다!');
    }
    
    setupEventListeners() {
        // 페이지 변경 이벤트 리스너
        document.addEventListener('pageChange', (e) => {
            this.loadPage(e.detail.page);
        });
        
        // 키보드 네비게이션
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
        
        // 터치 이벤트 (모바일)
        this.setupTouchNavigation();
    }
    
    setupClickableTexts() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('clickable-text')) {
                const targetPage = e.target.getAttribute('data-page');
                if (targetPage) {
                    this.loadPage(targetPage);
                }
            }
        });
    }
    
    setupTouchNavigation() {
        let touchStartX = 0;
        let touchEndX = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        });
    }
    
    handleSwipe(startX, endX) {
        const swipeThreshold = 50;
        const pageOrder = ['home', 'drawingBoard', 'mobile', 'design'];
        const currentIndex = pageOrder.indexOf(this.currentPage);
        
        if (endX < startX - swipeThreshold) {
            // 왼쪽으로 스와이프 - 다음 페이지
            if (currentIndex < pageOrder.length - 1) {
                this.loadPage(pageOrder[currentIndex + 1]);
            }
        } else if (endX > startX + swipeThreshold) {
            // 오른쪽으로 스와이프 - 이전 페이지
            if (currentIndex > 0) {
                this.loadPage(pageOrder[currentIndex - 1]);
            }
        }
    }
    
    handleKeyboardNavigation(e) {
        const pageOrder = ['home', 'drawingBoard', 'mobile', 'design'];
        const currentIndex = pageOrder.indexOf(this.currentPage);
        
        switch(e.key) {
            case 'ArrowRight':
            case ' ':
                // 다음 페이지로 이동
                if (currentIndex < pageOrder.length - 1) {
                    this.loadPage(pageOrder[currentIndex + 1]);
                }
                break;
            case 'ArrowLeft':
                // 이전 페이지로 이동
                if (currentIndex > 0) {
                    this.loadPage(pageOrder[currentIndex - 1]);
                }
                break;
            case 'Home':
                // 첫 페이지로 이동
                this.loadPage('home');
                break;
            case 'End':
                // 마지막 페이지로 이동
                this.loadPage('design');
                break;
        }
    }
    
    loadPage(pageName) {
        try {
            // 모든 페이지 숨기기
            const pages = document.querySelectorAll('.page');
            pages.forEach(page => {
                page.style.display = 'none';
            });
            
            // 선택된 페이지 표시
            const targetPage = document.getElementById(`${pageName}Page`);
            if (targetPage) {
                targetPage.style.display = 'block';
                
                // 페이지 전환 애니메이션
                targetPage.style.opacity = '0';
                targetPage.style.transform = 'translateX(50px)';
                
                setTimeout(() => {
                    targetPage.style.opacity = '1';
                    targetPage.style.transform = 'translateX(0)';
                }, 50);
            }
            
            // 현재 페이지 업데이트
            this.currentPage = pageName;
            
            // 파일 매니저 업데이트
            if (this.fileManager) {
                this.fileManager.updateCurrentPage(pageName);
            }
            
            // 그림판 페이지인 경우 DrawingBoard 초기화
            if (pageName === 'drawingBoard') {
                this.initializeDrawingBoard();
            }
            
            console.log(`${pageName} 페이지가 로드되었습니다.`);
            
        } catch (error) {
            console.error('페이지 로드 오류:', error);
            this.showError(`페이지를 로드할 수 없습니다: ${error.message}`);
        }
    }
    
    initializeDrawingBoard() {
        // 기존 DrawingBoard 인스턴스가 있다면 제거
        if (window.drawingBoard) {
            delete window.drawingBoard;
        }
        
        // 새로운 DrawingBoard 인스턴스 생성
        setTimeout(() => {
            window.drawingBoard = new DrawingBoard();
        }, 100);
    }
    
    showError(message) {
        console.error('오류:', message);
        // 오류 발생 시 홈 페이지로 이동
        this.loadPage('home');
    }
    
    // 현재 페이지 정보 가져오기
    getCurrentPage() {
        return this.currentPage;
    }
    
    // 파일 통계 가져오기
    getFileStats() {
        return this.fileManager ? this.fileManager.getFileStats() : null;
    }
}

// 전역 앱 인스턴스
let app;

// DOM 로드 완료 후 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    
    // 브라우저 뒤로가기/앞으로가기 이벤트 처리
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.page) {
            app.loadPage(e.state.page);
        }
    });
});

// 전역 객체로 노출
window.app = app;
