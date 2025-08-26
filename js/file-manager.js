// 파일 관리 클래스
class FileManager {
    constructor() {
        this.files = {};
        this.currentPage = 'home';
        this.init();
    }
    
    init() {
        this.loadFilesFromStorage();
        this.setupFileUploads();
        this.setupFileActions();
        this.setupDragAndDrop();
    }
    
    // 파일 업로드 설정
    setupFileUploads() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files, input.id);
            });
        });
    }
    
    // 파일 액션 설정
    setupFileActions() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('download-btn')) {
                this.handleFileDownload(e);
            } else if (e.target.classList.contains('delete-btn')) {
                this.handleFileDelete(e);
            }
        });
    }
    
    // 드래그 앤 드롭 설정
    setupDragAndDrop() {
        const uploadAreas = document.querySelectorAll('.file-upload-area');
        
        uploadAreas.forEach(area => {
            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.classList.add('dragover');
            });
            
            area.addEventListener('dragleave', (e) => {
                e.preventDefault();
                area.classList.remove('dragover');
            });
            
            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.classList.remove('dragover');
                const files = e.dataTransfer.files;
                const fileInput = area.querySelector('input[type="file"]');
                if (fileInput) {
                    this.handleFileUpload(files, fileInput.id);
                }
            });
        });
    }
    
    // 파일 업로드 처리
    handleFileUpload(files, inputId) {
        const pageName = inputId.replace('fileInput', '').toLowerCase();
        const fileList = this.files[pageName] || [];
        
        Array.from(files).forEach(file => {
            const fileInfo = {
                id: Date.now() + Math.random(),
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                icon: Utils.getFileIcon(file.name),
                fileType: Utils.getFileType(file.name)
            };
            
            fileList.push(fileInfo);
            
            // 파일 내용을 메모리에 저장 (실제 프로젝트에서는 서버로 업로드)
            this.storeFileContent(fileInfo.id, file);
        });
        
        this.files[pageName] = fileList;
        this.saveFilesToStorage();
        this.renderFileList(pageName);
        
        Utils.showNotification(`${files.length}개 파일이 업로드되었습니다.`, 'success');
    }
    
    // 파일 다운로드 처리
    handleFileDownload(e) {
        const fileItem = e.target.closest('.file-item');
        const fileName = fileItem.querySelector('h4').textContent;
        const fileId = fileItem.dataset.fileId;
        
        // 실제 프로젝트에서는 서버에서 파일을 가져옴
        const fileContent = this.getFileContent(fileId);
        if (fileContent) {
            Utils.downloadFile(fileName, fileContent);
            Utils.showNotification(`${fileName} 파일이 다운로드되었습니다.`, 'success');
        } else {
            Utils.showNotification('파일을 찾을 수 없습니다.', 'error');
        }
    }
    
    // 파일 삭제 처리
    handleFileDelete(e) {
        const fileItem = e.target.closest('.file-item');
        const fileName = fileItem.querySelector('h4').textContent;
        const fileId = fileItem.dataset.fileId;
        
        if (Utils.confirmDelete(fileName)) {
            const pageName = this.currentPage;
            const fileList = this.files[pageName] || [];
            const updatedList = fileList.filter(file => file.id != fileId);
            
            this.files[pageName] = updatedList;
            this.saveFilesToStorage();
            this.renderFileList(pageName);
            
            Utils.showNotification(`${fileName} 파일이 삭제되었습니다.`, 'success');
        }
    }
    
    // 파일 목록 렌더링
    renderFileList(pageName) {
        const fileListElement = document.getElementById(`fileList${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`);
        if (!fileListElement) return;
        
        const files = this.files[pageName] || [];
        
        if (files.length === 0) {
            fileListElement.innerHTML = '<p class="no-files">업로드된 파일이 없습니다.</p>';
            return;
        }
        
        fileListElement.innerHTML = files.map(file => `
            <div class="file-item" data-file-id="${file.id}">
                <div class="file-icon" data-type="${file.fileType}">${file.icon}</div>
                <div class="file-info">
                    <h4>${file.name}</h4>
                    <p>${file.type || '알 수 없는 파일 형식'}</p>
                    <span class="file-size">${Utils.formatFileSize(file.size)}</span>
                </div>
                <div class="file-actions">
                    <button class="action-btn download-btn" title="다운로드">⬇️</button>
                    <button class="action-btn delete-btn" title="삭제">🗑️</button>
                </div>
            </div>
        `).join('');
    }
    
    // 파일 내용 저장 (메모리)
    storeFileContent(fileId, file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.fileContents = this.fileContents || {};
            this.fileContents[fileId] = e.target.result;
        };
        reader.readAsText(file);
    }
    
    // 파일 내용 가져오기
    getFileContent(fileId) {
        return this.fileContents ? this.fileContents[fileId] : null;
    }
    
    // 로컬 스토리지에서 파일 목록 로드
    loadFilesFromStorage() {
        const savedFiles = Utils.storage.get('fileManager_files');
        if (savedFiles) {
            this.files = savedFiles;
        }
    }
    
    // 로컬 스토리지에 파일 목록 저장
    saveFilesToStorage() {
        Utils.storage.set('fileManager_files', this.files);
    }
    
    // 페이지 변경 시 파일 목록 업데이트
    updateCurrentPage(pageName) {
        this.currentPage = pageName;
        this.renderFileList(pageName);
    }
    
    // 파일 검색
    searchFiles(query, pageName = null) {
        const searchPage = pageName || this.currentPage;
        const files = this.files[searchPage] || [];
        
        if (!query) return files;
        
        return files.filter(file => 
            file.name.toLowerCase().includes(query.toLowerCase()) ||
            file.type.toLowerCase().includes(query.toLowerCase())
        );
    }
    
    // 파일 통계
    getFileStats(pageName = null) {
        const targetPage = pageName || this.currentPage;
        const files = this.files[targetPage] || [];
        
        return {
            totalFiles: files.length,
            totalSize: files.reduce((sum, file) => sum + file.size, 0),
            fileTypes: files.reduce((types, file) => {
                const type = file.fileType;
                types[type] = (types[type] || 0) + 1;
                return types;
            }, {})
        };
    }
}

// 전역 객체로 노출
window.FileManager = FileManager;

// 그림판 관리 클래스
class DrawingBoard {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.brushSize = 5;
        this.color = '#000000';
        this.savedDrawings = [];
        
        this.init();
    }
    
    init() {
        this.loadSavedDrawings();
        this.setupCanvas();
        this.setupTools();
        this.setupEventListeners();
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('drawingCanvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.brushSize;
    }
    
    setupTools() {
        const brushSizeSlider = document.getElementById('brushSize');
        const brushSizeValue = document.getElementById('brushSizeValue');
        const colorPicker = document.getElementById('colorPicker');
        
        if (brushSizeSlider && brushSizeValue) {
            brushSizeSlider.addEventListener('input', (e) => {
                this.brushSize = parseInt(e.target.value);
                brushSizeValue.textContent = `${this.brushSize}px`;
                if (this.ctx) {
                    this.ctx.lineWidth = this.brushSize;
                }
            });
        }
        
        if (colorPicker) {
            colorPicker.addEventListener('change', (e) => {
                this.color = e.target.value;
                if (this.ctx) {
                    this.ctx.strokeStyle = this.color;
                }
            });
        }
    }
    
    setupEventListeners() {
        if (!this.canvas) return;
        
        // 마우스 이벤트
        this.canvas.addEventListener('mousedown', (e) => this.startOrStopDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        
        // 터치 이벤트 (모바일)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.stopDrawing());
        
        // 도구 버튼 이벤트
        const clearBtn = document.getElementById('clearCanvas');
        const downloadBtn = document.getElementById('downloadCanvas');
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearCanvas());
        }
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadDrawing());
        }
    }

    startOrStopDrawing(e) {
        this.isDrawing = !this.isDrawing;

        // 그리기 시작할 때 새로운 경로 시작
        this.ctx.beginPath();
    }
    
    startDrawing(e) {
        this.isDrawing = true;

        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
        
        // 그리기 시작할 때 새로운 경로 시작
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
    }

    stopDrawing() {
        this.isDrawing = false;
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        this.ctx.lineTo(currentX, currentY);
        this.ctx.stroke();
        
        this.lastX = currentX;
        this.lastY = currentY;

    }
    
    clearCanvas() {
        if (confirm('캔버스를 지우시겠습니까?')) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    saveDrawing() {
        const drawingData = {
            id: Date.now(),
            name: `그림_${new Date().toLocaleDateString()}`,
            date: new Date().toISOString(),
            dataURL: this.canvas.toDataURL('image/png')
        };
        
        this.savedDrawings.push(drawingData);
        this.saveToStorage();
        this.renderSavedDrawings();
        
        Utils.showNotification('그림이 저장되었습니다!', 'success');
    }
    
    downloadDrawing() {
        const link = document.createElement('a');
        link.download = `drawing_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        
        Utils.showNotification('그림이 다운로드되었습니다!', 'success');
    }
    
    loadSavedDrawings() {
        const saved = Utils.storage.get('savedDrawings');
        if (saved) {
            this.savedDrawings = saved;
        }
    }
    
    saveToStorage() {
        Utils.storage.set('savedDrawings', this.savedDrawings);
    }
    
    renderSavedDrawings() {
        const grid = document.getElementById('drawingsGrid');
        if (!grid) return;
        
        if (this.savedDrawings.length === 0) {
            grid.innerHTML = '<p class="no-drawings">저장된 그림이 없습니다.</p>';
            return;
        }
        
        grid.innerHTML = this.savedDrawings.map(drawing => `
            <div class="drawing-item" data-drawing-id="${drawing.id}">
                <div class="drawing-preview">
                    <img src="${drawing.dataURL}" alt="${drawing.name}" style="max-width: 100%; max-height: 100%; border-radius: 6px;">
                </div>
                <div class="drawing-info">
                    <h4>${drawing.name}</h4>
                    <p>${new Date(drawing.date).toLocaleDateString()}</p>
                </div>
                <div class="drawing-actions">
                    <button class="action-btn download-btn" title="다운로드" onclick="drawingBoard.downloadSavedDrawing(${drawing.id})">⬇️</button>
                    <button class="action-btn delete-btn" title="삭제" onclick="drawingBoard.deleteSavedDrawing(${drawing.id})">🗑️</button>
                </div>
            </div>
        `).join('');
    }
    
    downloadSavedDrawing(id) {
        const drawing = this.savedDrawings.find(d => d.id === id);
        if (drawing) {
            const link = document.createElement('a');
            link.download = `${drawing.name}.png`;
            link.href = drawing.dataURL;
            link.click();
            
            Utils.showNotification('그림이 다운로드되었습니다!', 'success');
        }
    }
    
    deleteSavedDrawing(id) {
        if (confirm('이 그림을 삭제하시겠습니까?')) {
            this.savedDrawings = this.savedDrawings.filter(d => d.id !== id);
            this.saveToStorage();
            this.renderSavedDrawings();
            
            Utils.showNotification('그림이 삭제되었습니다!', 'success');
        }
    }
}

// 전역 객체로 노출
window.DrawingBoard = DrawingBoard;
