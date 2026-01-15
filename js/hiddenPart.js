// 숨은그림 게임 클래스
class HiddenPictureGame {
  constructor() {
    this.fileInput = document.getElementById("hiddenImageInput");
    this.uploadBtn = document.getElementById("hiddenImageUploadBtn");
    this.canvas = document.getElementById("hiddenImageCanvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.pointsCountInput = document.getElementById("hiddenPointsCount");
    this.generatePointsBtn = document.getElementById("generatePointsBtn");
    this.pointsList = document.getElementById("hiddenPointsList");
    this.messageEl = document.getElementById("hiddenGameMessage");

    this.image = new Image();
    this.points = [];
    this.hitRadius = 40;
    // 실제 이미지가 그려진 영역 (좌우/상하 여백 제외)
    this.drawRegion = null;
    // 이미지 안쪽으로 한 번 더 여유를 두기 위한 패딩 (px)
    this.pointPadding = 20;
    this.storageKey = "hiddenPictureGame_state";

    this.init();
  }

  init() {
    if (!this.canvas || !this.ctx) {
      return;
    }

    this.bindEvents();
    this.loadFromStorage();
  }

  bindEvents() {
    if (this.uploadBtn && this.fileInput) {
      this.uploadBtn.addEventListener("click", () => {
        this.fileInput.click();
      });

      this.fileInput.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          this.loadImageFile(file);
        }
      });
    }

    if (this.generatePointsBtn) {
      this.generatePointsBtn.addEventListener("click", () => {
        if (!this.image || !this.image.src) {
          this.showMessage("먼저 이미지를 업로드해주세요.", "warning");
          return;
        }
        this.generateRandomPoints();
      });
    }

    // 캔버스 클릭으로 정답/오답 판정
    if (this.canvas) {
      this.canvas.addEventListener("click", (e) => this.handleCanvasClick(e));
    }
  }

  loadImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.image = new Image();
      this.image.onload = () => {
        this.drawImageToCanvas();
        this.points = [];
        this.renderPointsList();
        this.saveToStorage();
        this.showMessage(
          "이미지가 업로드되었습니다. 포인트를 생성해보세요!",
          "success"
        );
      };
      this.image.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  drawImageToCanvas() {
    if (!this.image || !this.canvas || !this.ctx) return;

    // 캔버스 초기화
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const canvasRatio = this.canvas.width / this.canvas.height;
    const imageRatio = this.image.width / this.image.height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imageRatio > canvasRatio) {
      drawWidth = this.canvas.width;
      drawHeight = drawWidth / imageRatio;
    } else {
      drawHeight = this.canvas.height;
      drawWidth = drawHeight * imageRatio;
    }

    offsetX = (this.canvas.width - drawWidth) / 2;
    offsetY = (this.canvas.height - drawHeight) / 2;

    // 실제 이미지가 차지하는 영역 저장
    this.drawRegion = {
      x: offsetX,
      y: offsetY,
      width: drawWidth,
      height: drawHeight,
    };

    this.ctx.drawImage(this.image, offsetX, offsetY, drawWidth, drawHeight);
  }

  generateRandomPoints() {
    const count = Math.min(
      Math.max(parseInt(this.pointsCountInput.value || "5", 10), 1),
      10
    );

    this.points = [];

    // 이미지가 실제로 그려진 영역 기준으로만 포인트 생성
    if (!this.drawRegion) {
      // drawRegion이 없으면 이미지 영역을 다시 계산
      if (this.image && this.image.complete) {
        this.drawImageToCanvas();
      } else {
        this.showMessage(
          "이미지 영역을 계산할 수 없습니다. 이미지를 다시 업로드해주세요.",
          "error"
        );
        return;
      }
    }

    const region = this.drawRegion;
    if (!region) {
      this.showMessage("이미지 영역을 찾을 수 없습니다.", "error");
      return;
    }

    // hitRadius(정답 판정 반경) + 추가 패딩만큼 가장자리를 잘라내고 포인트 생성
    const margin = this.hitRadius + this.pointPadding;
    const safeWidth = Math.max(region.width - margin * 2, 0);
    const safeHeight = Math.max(region.height - margin * 2, 0);

    if (safeWidth <= 0 || safeHeight <= 0) {
      this.showMessage(
        "이미지가 너무 작아서 포인트를 생성할 수 없습니다.",
        "error"
      );
      return;
    }

    for (let i = 0; i < count; i++) {
      const x = region.x + margin + Math.random() * safeWidth;
      const y = region.y + margin + Math.random() * safeHeight;

      const previewInfo = this.createPointPreview(x, y);
      console.log("포인트좌표", x, y);
      this.points.push({
        id: Date.now() + Math.random(),
        x, // 미리보기 영역의 중심 X 좌표
        y, // 미리보기 영역의 중심 Y 좌표
        found: false,
        previewDataUrl: previewInfo ? previewInfo.dataUrl : null,
        previewSize: previewInfo ? previewInfo.size : 80, // 미리보기 영역의 크기
      });
    }

    this.renderPointsList();
    this.saveToStorage();
    this.showMessage(
      `${count}개의 숨은 포인트가 생성되었습니다. 캔버스를 클릭해서 찾아보세요!`,
      "info"
    );
  }

  createPointPreview(x, y) {
    if (!this.canvas) return null;

    const size = 80;
    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = size;
    previewCanvas.height = size;
    const previewCtx = previewCanvas.getContext("2d");

    previewCtx.drawImage(
      this.canvas,
      x - size / 2,
      y - size / 2,
      size,
      size,
      0,
      0,
      size,
      size
    );

    return {
      dataUrl: previewCanvas.toDataURL("image/png"),
      size: size,
    };
  }

  handleCanvasClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    // 캔버스의 실제 크기와 표시 크기의 비율 계산 (CSS 스케일링 고려)
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    // 클릭 좌표를 캔버스 내부 좌표로 변환
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    let hitPoint = null;

    this.points.forEach((point) => {
      if (point.found) return;

      // 미리보기 영역의 크기 (기본값 80)
      const previewSize = point.previewSize || 80;

      // 미리보기 영역의 사각형 범위 계산
      const previewLeft = point.x - previewSize / 2;
      const previewRight = point.x + previewSize / 2;
      const previewTop = point.y - previewSize / 2;
      const previewBottom = point.y + previewSize / 2;

      // 클릭 위치가 미리보기 영역 안에 있는지 확인
      if (
        clickX >= previewLeft &&
        clickX <= previewRight &&
        clickY >= previewTop &&
        clickY <= previewBottom &&
        !hitPoint
      ) {
        hitPoint = point;
      }
    });

    if (hitPoint) {
      hitPoint.found = true;
      this.renderPointsList();
      this.saveToStorage();
      this.showMessage("🎉 정답입니다! 숨은 포인트를 찾았어요.", "success");
      this.drawFoundMarker(hitPoint);
    } else {
      this.showMessage("❌ 틀렸어요! 다른 곳을 눌러보세요.", "error");
    }
  }

  drawFoundMarker(point) {
    if (!this.ctx) return;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.strokeStyle = "#27ae60";
    this.ctx.lineWidth = 3;
    // 미리보기 영역의 중심 좌표를 기준으로 원 그리기
    this.ctx.arc(point.x, point.y, this.hitRadius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  renderPointsList() {
    if (!this.pointsList) return;

    if (!this.points.length) {
      this.pointsList.innerHTML =
        '<p class="no-points">아직 생성된 포인트가 없습니다.</p>';
      return;
    }

    this.pointsList.innerHTML = this.points
      .map(
        (point, index) => `
                <div class="hidden-point-item ${
                  point.found ? "found" : ""
                }" data-point-id="${point.id}">
                    <div class="hidden-point-preview">
                        ${
                          point.previewDataUrl
                            ? `<img src="${point.previewDataUrl}" alt="포인트 미리보기">`
                            : ""
                        }
                    </div>
                    <div class="hidden-point-info">
                        <h4>포인트 ${index + 1}</h4>
                        <p>${
                          point.found ? "✅ 맞췄어요!" : "❓ 아직 못 찾았어요"
                        }</p>
                    </div>
                </div>
            `
      )
      .join("");
  }

  saveToStorage() {
    if (!this.canvas) return;
    try {
      const data = {
        imageData: this.canvas.toDataURL("image/png"),
        points: this.points,
        drawRegion: this.drawRegion, // 이미지 영역 정보도 함께 저장
      };
      Utils.storage.set(this.storageKey, data);
    } catch (e) {
      console.error("숨은그림 저장 오류:", e);
    }
  }

  loadFromStorage() {
    const saved = Utils.storage.get(this.storageKey);
    if (!saved || !saved.imageData) return;

    const img = new Image();
    img.onload = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // 저장된 drawRegion이 있으면 사용, 없으면 이미지를 다시 그려서 계산
      if (saved.drawRegion) {
        this.drawRegion = saved.drawRegion;
        // 저장된 이미지가 이미 drawRegion에 맞게 그려져 있으므로 그대로 사용
        this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
      } else {
        // 이전 버전 호환: 이미지를 다시 그려서 drawRegion 계산
        this.image = img;
        this.drawImageToCanvas();
      }

      this.image = img;
      this.points = saved.points || [];
      this.renderPointsList();
      this.showMessage("이전에 저장된 숨은그림 게임을 불러왔습니다.", "info");
    };
    img.src = saved.imageData;
  }

  showMessage(text, type = "info") {
    if (this.messageEl) {
      this.messageEl.textContent = text;
    }
    if (window.Utils && Utils.showNotification) {
      Utils.showNotification(text, type);
    }
  }
}

// 전역 객체로 노출
window.HiddenPictureGame = HiddenPictureGame;

// 그림판 관리 클래스
class DrawingBoard {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.brushSize = 5;
    this.color = "#000000";
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
    this.canvas = document.getElementById("drawingCanvas");
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext("2d");
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.brushSize;
  }

  setupTools() {
    const brushSizeSlider = document.getElementById("brushSize");
    const brushSizeValue = document.getElementById("brushSizeValue");
    const colorPicker = document.getElementById("colorPicker");

    if (brushSizeSlider && brushSizeValue) {
      brushSizeSlider.addEventListener("input", (e) => {
        this.brushSize = parseInt(e.target.value);
        brushSizeValue.textContent = `${this.brushSize}px`;
        if (this.ctx) {
          this.ctx.lineWidth = this.brushSize;
        }
      });
    }

    if (colorPicker) {
      colorPicker.addEventListener("change", (e) => {
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
    this.canvas.addEventListener("mousedown", (e) =>
      this.startOrStopDrawing(e)
    );
    this.canvas.addEventListener("mousemove", (e) => this.draw(e));

    // 터치 이벤트 (모바일)
    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.startDrawing(e.touches[0]);
    });
    this.canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      this.draw(e.touches[0]);
    });
    this.canvas.addEventListener("touchend", () => this.stopDrawing());

    // 도구 버튼 이벤트
    const clearBtn = document.getElementById("clearCanvas");
    const downloadBtn = document.getElementById("downloadCanvas");

    if (clearBtn) {
      clearBtn.addEventListener("click", () => this.clearCanvas());
    }

    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => this.downloadDrawing());
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
    if (confirm("캔버스를 지우시겠습니까?")) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  saveDrawing() {
    const drawingData = {
      id: Date.now(),
      name: `그림_${new Date().toLocaleDateString()}`,
      date: new Date().toISOString(),
      dataURL: this.canvas.toDataURL("image/png"),
    };

    this.savedDrawings.push(drawingData);
    this.saveToStorage();
    this.renderSavedDrawings();

    Utils.showNotification("그림이 저장되었습니다!", "success");
  }

  downloadDrawing() {
    const link = document.createElement("a");
    link.download = `drawing_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = this.canvas.toDataURL("image/png");
    link.click();

    Utils.showNotification("그림이 다운로드되었습니다!", "success");
  }

  loadSavedDrawings() {
    const saved = Utils.storage.get("savedDrawings");
    if (saved) {
      this.savedDrawings = saved;
    }
  }

  saveToStorage() {
    Utils.storage.set("savedDrawings", this.savedDrawings);
  }

  renderSavedDrawings() {
    const grid = document.getElementById("drawingsGrid");
    if (!grid) return;

    if (this.savedDrawings.length === 0) {
      grid.innerHTML = '<p class="no-drawings">저장된 그림이 없습니다.</p>';
      return;
    }

    grid.innerHTML = this.savedDrawings
      .map(
        (drawing) => `
            <div class="drawing-item" data-drawing-id="${drawing.id}">
                <div class="drawing-preview">
                    <img src="${drawing.dataURL}" alt="${
          drawing.name
        }" style="max-width: 100%; max-height: 100%; border-radius: 6px;">
                </div>
                <div class="drawing-info">
                    <h4>${drawing.name}</h4>
                    <p>${new Date(drawing.date).toLocaleDateString()}</p>
                </div>
                <div class="drawing-actions">
                    <button class="action-btn download-btn" title="다운로드" onclick="drawingBoard.downloadSavedDrawing(${
                      drawing.id
                    })">⬇️</button>
                    <button class="action-btn delete-btn" title="삭제" onclick="drawingBoard.deleteSavedDrawing(${
                      drawing.id
                    })">🗑️</button>
                </div>
            </div>
        `
      )
      .join("");
  }

  downloadSavedDrawing(id) {
    const drawing = this.savedDrawings.find((d) => d.id === id);
    if (drawing) {
      const link = document.createElement("a");
      link.download = `${drawing.name}.png`;
      link.href = drawing.dataURL;
      link.click();

      Utils.showNotification("그림이 다운로드되었습니다!", "success");
    }
  }

  deleteSavedDrawing(id) {
    if (confirm("이 그림을 삭제하시겠습니까?")) {
      this.savedDrawings = this.savedDrawings.filter((d) => d.id !== id);
      this.saveToStorage();
      this.renderSavedDrawings();

      Utils.showNotification("그림이 삭제되었습니다!", "success");
    }
  }
}

// 전역 객체로 노출
window.DrawingBoard = DrawingBoard;
