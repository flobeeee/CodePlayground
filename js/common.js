// 공통 유틸리티 함수들
const Utils = {
    // 파일 크기 포맷팅
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // 파일 확장자로부터 아이콘 결정
    getFileIcon: function(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            // 문서
            'pdf': '📄', 'doc': '📄', 'docx': '📄', 'txt': '📄', 'md': '📄',
            // 이미지
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'svg': '🖼️',
            // 코드
            'html': '📄', 'css': '🎨', 'js': '⚙️', 'jsx': '⚙️', 'ts': '⚙️', 'tsx': '⚙️',
            'py': '🐍', 'java': '☕', 'cpp': '⚙️', 'c': '⚙️', 'php': '🐘',
            // 압축
            'zip': '📦', 'rar': '📦', '7z': '📦', 'tar': '📦', 'gz': '📦',
            // 디자인
            'psd': '🎨', 'ai': '📐', 'sketch': '📐', 'fig': '📐',
            // 기타
            'json': '📦', 'xml': '📄', 'csv': '📊', 'xlsx': '📊', 'xls': '📊'
        };
        return iconMap[ext] || '📄';
    },

    // 파일 타입 결정
    getFileType: function(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'webp'];
        const codeExts = ['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'php'];
        const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz'];
        
        if (imageExts.includes(ext)) return 'image';
        if (codeExts.includes(ext)) return 'code';
        if (archiveExts.includes(ext)) return 'archive';
        return 'document';
    },

    // 로컬 스토리지 관리
    storage: {
        get: function(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('Storage get error:', e);
                return null;
            }
        },
        
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage set error:', e);
                return false;
            }
        },
        
        remove: function(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Storage remove error:', e);
                return false;
            }
        }
    },

    // 알림 표시
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 스타일 추가
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;
        
        // 타입별 색상
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // 애니메이션
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 자동 제거
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    },

    // 파일 다운로드 시뮬레이션
    downloadFile: function(filename, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // 파일 삭제 확인
    confirmDelete: function(filename) {
        return confirm(`정말로 "${filename}" 파일을 삭제하시겠습니까?`);
    }
};

// 전역 객체로 노출
window.Utils = Utils;
