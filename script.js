document.addEventListener('DOMContentLoaded', function() {
    // DOM 요소들
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('closeBtn');
    const mainContainer = document.querySelector('.main-container');
    const clickableTexts = document.querySelectorAll('.clickable-text');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // 사이드바 토글 기능
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
        menuToggle.classList.toggle('open');
        mainContainer.classList.toggle('shifted');
    });
    
    // 사이드바 닫기 버튼
    closeBtn.addEventListener('click', function() {
        sidebar.classList.remove('open');
        menuToggle.classList.remove('open');
        mainContainer.classList.remove('shifted');
    });
    
    // 사이드바 외부 클릭 시 닫기
    document.addEventListener('click', function(event) {
        if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                menuToggle.classList.remove('open');
                mainContainer.classList.remove('shifted');
            }
        }
    });
    
    // 클릭 가능한 텍스트 요소들에 이벤트 리스너 추가
    clickableTexts.forEach(text => {
        text.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');
            changePage(targetPage);
        });
    });
    
    // 사이드바 네비게이션 링크에 이벤트 리스너 추가
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            changePage(targetPage);
            
            // 모바일에서 사이드바 자동 닫기
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
                menuToggle.classList.remove('open');
                mainContainer.classList.remove('shifted');
            }
        });
    });
    
    // 페이지 변경 함수
    function changePage(pageNumber) {
        // 현재 표시된 페이지 찾기
        const currentPage = document.querySelector('.page:not([style*="display: none"])');
        const targetPage = document.getElementById(`page${pageNumber}`);
        
        if (currentPage && targetPage) {
            // 현재 페이지에 페이드아웃 효과 적용
            currentPage.classList.add('fade-out');
            
            // 애니메이션 완료 후 페이지 전환
            setTimeout(() => {
                currentPage.style.display = 'none';
                currentPage.classList.remove('fade-out');
                
                // 새 페이지 표시
                targetPage.style.display = 'block';
                targetPage.classList.add('fade-in');
                
                // 페이드인 효과 제거
                setTimeout(() => {
                    targetPage.classList.remove('fade-in');
                }, 500);
                
                // 페이지 변경 시 스크롤을 맨 위로
                window.scrollTo(0, 0);
                
                // 네비게이션 링크 활성 상태 업데이트
                updateActiveNavLink(pageNumber);
                
                // 페이지 변경 로그 (선택사항)
                console.log(`페이지 ${pageNumber}로 이동했습니다.`);
                
            }, 300);
        }
    }
    
    // 네비게이션 링크 활성 상태 업데이트
    function updateActiveNavLink(pageNumber) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageNumber) {
                link.classList.add('active');
            }
        });
    }
    
    // 키보드 네비게이션 지원 (선택사항)
    document.addEventListener('keydown', function(event) {
        const currentPage = document.querySelector('.page:not([style*="display: none"])');
        if (currentPage) {
            const currentPageNumber = currentPage.id.replace('page', '');
            
            switch(event.key) {
                case 'ArrowRight':
                case ' ':
                    // 다음 페이지로 이동
                    const nextPage = parseInt(currentPageNumber) + 1;
                    if (document.getElementById(`page${nextPage}`)) {
                        changePage(nextPage);
                    }
                    break;
                case 'ArrowLeft':
                    // 이전 페이지로 이동
                    const prevPage = parseInt(currentPageNumber) - 1;
                    if (prevPage > 0 && document.getElementById(`page${prevPage}`)) {
                        changePage(prevPage);
                    }
                    break;
                case 'Home':
                    // 첫 페이지로 이동
                    changePage(1);
                    break;
                case 'End':
                    // 마지막 페이지로 이동
                    const pages = document.querySelectorAll('.page');
                    changePage(pages.length);
                    break;
            }
        }
    });
    
    // 터치 이벤트 지원 (모바일)
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', function(event) {
        touchStartX = event.changedTouches[0].screenX;
    });
    
    document.addEventListener('touchend', function(event) {
        touchEndX = event.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const currentPage = document.querySelector('.page:not([style*="display: none"])');
        if (currentPage) {
            const currentPageNumber = parseInt(currentPage.id.replace('page', ''));
            const swipeThreshold = 50;
            
            if (touchEndX < touchStartX - swipeThreshold) {
                // 왼쪽으로 스와이프 - 다음 페이지
                const nextPage = currentPageNumber + 1;
                if (document.getElementById(`page${nextPage}`)) {
                    changePage(nextPage);
                }
            } else if (touchEndX > touchStartX + swipeThreshold) {
                // 오른쪽으로 스와이프 - 이전 페이지
                const prevPage = currentPageNumber - 1;
                if (prevPage > 0 && document.getElementById(`page${prevPage}`)) {
                    changePage(prevPage);
                }
            }
        }
    }
    
    // 페이지 로드 시 첫 번째 페이지 활성화
    console.log('웹페이지가 로드되었습니다. 글자를 클릭하여 페이지를 변경해보세요!');
});
