// 사이드바 관리 클래스
class SidebarManager {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.menuToggle = document.getElementById('menuToggle');
        this.closeBtn = document.getElementById('closeBtn');
        this.mainContainer = document.querySelector('.main-container');
        this.navLinks = document.querySelectorAll('.nav-link');
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.setupClickOutside();
        this.setupKeyboardNavigation();
    }
    
    bindEvents() {
        // 메뉴 토글 버튼
        this.menuToggle.addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        // 사이드바 닫기 버튼
        this.closeBtn.addEventListener('click', () => {
            this.closeSidebar();
        });
        
        // 네비게이션 링크
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = link.getAttribute('data-page');
                this.navigateToPage(targetPage);
                
                // 모바일에서 사이드바 자동 닫기
                if (window.innerWidth <= 768) {
                    this.closeSidebar();
                }
            });
        });
    }
    
    setupClickOutside() {
        document.addEventListener('click', (event) => {
            if (!this.sidebar.contains(event.target) && !this.menuToggle.contains(event.target)) {
                if (this.sidebar.classList.contains('open')) {
                    this.closeSidebar();
                }
            }
        });
    }
    
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (event) => {
            // ESC 키로 사이드바 닫기
            if (event.key === 'Escape' && this.sidebar.classList.contains('open')) {
                this.closeSidebar();
            }
            
            // Alt + M으로 메뉴 토글
            if (event.altKey && event.key === 'm') {
                event.preventDefault();
                this.toggleSidebar();
            }
        });
    }
    
    toggleSidebar() {
        this.sidebar.classList.toggle('open');
        this.menuToggle.classList.toggle('open');
        this.mainContainer.classList.toggle('shifted');
        
        // 애니메이션 효과
        if (this.sidebar.classList.contains('open')) {
            this.sidebar.style.transform = 'translateX(0)';
        } else {
            this.sidebar.style.transform = 'translateX(-100%)';
        }
    }
    
    openSidebar() {
        this.sidebar.classList.add('open');
        this.menuToggle.classList.add('open');
        this.mainContainer.classList.add('shifted');
        this.sidebar.style.transform = 'translateX(0)';
    }
    
    closeSidebar() {
        this.sidebar.classList.remove('open');
        this.menuToggle.classList.remove('open');
        this.mainContainer.classList.remove('shifted');
        this.sidebar.style.transform = 'translateX(-100%)';
    }
    
    navigateToPage(pageName) {
        // 네비게이션 링크 활성 상태 업데이트
        this.updateActiveNavLink(pageName);
        
        // 페이지 변경 이벤트 발생
        const event = new CustomEvent('pageChange', {
            detail: { page: pageName }
        });
        document.dispatchEvent(event);
    }
    
    updateActiveNavLink(pageName) {
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageName) {
                link.classList.add('active');
            }
        });
    }
    
    // 현재 활성 페이지 가져오기
    getCurrentPage() {
        const activeLink = document.querySelector('.nav-link.active');
        return activeLink ? activeLink.getAttribute('data-page') : 'home';
    }
    
    // 사이드바 상태 확인
    isOpen() {
        return this.sidebar.classList.contains('open');
    }
}

// 전역 객체로 노출
window.SidebarManager = SidebarManager;
