import {
    Component,
    AfterViewInit,
    ElementRef,
    EventEmitter,
    Input,
    Output,
    ViewChild,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    OnChanges,
    SimpleChanges,
} from '@angular/core';

@Component({
    standalone: false,
    selector: 'app-image-cropper',
    templateUrl: './image-cropper.component.html',
    styleUrls: ['./image-cropper.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageCropperComponent implements AfterViewInit, OnChanges {
    @Output() imageCropped = new EventEmitter<string>();
    @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

    /** Pass an existing imageUrl (URL or base64) to pre-load the cropper */
    @Input() initialImage: string | null | undefined = null;

    readonly DISPLAY_SIZE = 300;
    readonly OUTPUT_SIZE = 500;

    private ctx!: CanvasRenderingContext2D;
    private img: HTMLImageElement | null = null;
    private _scale = 1;
    _minScale = 0.1;
    private _offsetX = 0;
    private _offsetY = 0;
    _isDragging = false;
    private _dragStartX = 0;
    private _dragStartY = 0;
    private _lastOffsetX = 0;
    private _lastOffsetY = 0;
    private _lastTouchDist = 0;

    hasImage = false;
    croppedPreview: string | null = null;
    zoomValue = 1;
    confirmed = false;

    constructor(private cdr: ChangeDetectorRef) { }

    ngAfterViewInit(): void {
        this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
        this._drawBackground();
        if (this.initialImage) {
            this._loadFromSrc(this.initialImage);
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['initialImage'] && !changes['initialImage'].firstChange) {
            const val = changes['initialImage'].currentValue;
            if (val && this.ctx) {
                this._loadFromSrc(val);
            }
        }
    }

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            this._loadFromSrc(e.target!.result as string);
        };
        reader.readAsDataURL(file);
        input.value = '';
        this.confirmed = false;
    }

    private _loadFromSrc(src: string): void {
        const imgEl = new Image();
        imgEl.onload = () => {
            this.img = imgEl;
            this.hasImage = true;
            this.confirmed = false;
            this._fitImage();
            this._draw();
            this.cdr.markForCheck();
        };
        imgEl.src = src;
    }

    private _fitImage(): void {
        if (!this.img) return;
        const scaleX = this.DISPLAY_SIZE / this.img.width;
        const scaleY = this.DISPLAY_SIZE / this.img.height;
        this._scale = Math.max(scaleX, scaleY);
        this._minScale = this._scale * 0.4;
        this.zoomValue = this._scale;
        this._offsetX = (this.DISPLAY_SIZE - this.img.width * this._scale) / 2;
        this._offsetY = (this.DISPLAY_SIZE - this.img.height * this._scale) / 2;
    }

    private _drawBackground(): void {
        if (!this.ctx) return;
        const size = this.DISPLAY_SIZE;
        this.ctx.fillStyle = '#141428';
        this.ctx.fillRect(0, 0, size, size);
        // Grid lines
        this.ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        this.ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
            const x = (size / 3) * i;
            const y = (size / 3) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, size);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(size, y);
            this.ctx.stroke();
        }
    }

    private _draw(): void {
        if (!this.ctx) return;
        const size = this.DISPLAY_SIZE;
        this._drawBackground();
        if (this.img) {
            this.ctx.drawImage(
                this.img,
                this._offsetX,
                this._offsetY,
                this.img.width * this._scale,
                this.img.height * this._scale
            );
            // Rule-of-thirds grid overlay
            this.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            this.ctx.lineWidth = 1;
            for (let i = 1; i < 3; i++) {
                const x = (size / 3) * i;
                const y = (size / 3) * i;
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, size);
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(size, y);
                this.ctx.stroke();
            }
            // Border
            this.ctx.strokeStyle = 'rgba(139,92,246,0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(1, 1, size - 2, size - 2);
        }
    }

    /** Returns the ratio of canvas buffer pixels to CSS display pixels. */
    private _cssRatio(): number {
        const w = this.canvasRef.nativeElement.offsetWidth;
        return w > 0 ? this.DISPLAY_SIZE / w : 1;
    }

    // Mouse events
    onMouseDown(event: MouseEvent): void {
        if (!this.hasImage) return;
        this._isDragging = true;
        this._dragStartX = event.clientX;
        this._dragStartY = event.clientY;
        this._lastOffsetX = this._offsetX;
        this._lastOffsetY = this._offsetY;
        event.preventDefault();
    }

    onMouseMove(event: MouseEvent): void {
        if (!this._isDragging) return;
        const r = this._cssRatio();
        this._offsetX = this._lastOffsetX + (event.clientX - this._dragStartX) * r;
        this._offsetY = this._lastOffsetY + (event.clientY - this._dragStartY) * r;
        this._draw();
        event.preventDefault();
    }

    onMouseUp(): void {
        this._isDragging = false;
    }

    onWheel(event: WheelEvent): void {
        if (!this.hasImage) return;
        event.preventDefault();
        const delta = event.deltaY > 0 ? -0.06 : 0.06;
        this._zoomAt(this.DISPLAY_SIZE / 2, this.DISPLAY_SIZE / 2, delta);
    }

    private _zoomAt(cx: number, cy: number, delta: number): void {
        const newScale = Math.max(this._minScale, Math.min(8, this._scale + delta));
        const ratio = newScale / this._scale;
        this._offsetX = cx - ratio * (cx - this._offsetX);
        this._offsetY = cy - ratio * (cy - this._offsetY);
        this._scale = newScale;
        this.zoomValue = this._scale;
        this._draw();
        this.cdr.markForCheck();
    }

    onZoomSlider(event: Event): void {
        const val = parseFloat((event.target as HTMLInputElement).value);
        this._zoomAt(this.DISPLAY_SIZE / 2, this.DISPLAY_SIZE / 2, val - this._scale);
    }

    zoomBy(delta: number): void {
        this._zoomAt(this.DISPLAY_SIZE / 2, this.DISPLAY_SIZE / 2, delta);
    }

    // Touch events
    onTouchStart(event: TouchEvent): void {
        if (event.touches.length === 1) {
            this._isDragging = true;
            this._dragStartX = event.touches[0].clientX;
            this._dragStartY = event.touches[0].clientY;
            this._lastOffsetX = this._offsetX;
            this._lastOffsetY = this._offsetY;
        } else if (event.touches.length === 2) {
            this._isDragging = false;
            this._lastTouchDist = Math.hypot(
                event.touches[0].clientX - event.touches[1].clientX,
                event.touches[0].clientY - event.touches[1].clientY
            );
        }
        event.preventDefault();
    }

    onTouchMove(event: TouchEvent): void {
        if (event.touches.length === 1 && this._isDragging) {
            const r = this._cssRatio();
            this._offsetX = this._lastOffsetX + (event.touches[0].clientX - this._dragStartX) * r;
            this._offsetY = this._lastOffsetY + (event.touches[0].clientY - this._dragStartY) * r;
            this._draw();
        } else if (event.touches.length === 2) {
            const dist = Math.hypot(
                event.touches[0].clientX - event.touches[1].clientX,
                event.touches[0].clientY - event.touches[1].clientY
            );
            const delta = (dist - this._lastTouchDist) * 0.005;
            const r = this._cssRatio();
            const rect = this.canvasRef.nativeElement.getBoundingClientRect();
            const midX = ((event.touches[0].clientX + event.touches[1].clientX) / 2 - rect.left) * r;
            const midY = ((event.touches[0].clientY + event.touches[1].clientY) / 2 - rect.top) * r;
            this._zoomAt(midX, midY, delta);
            this._lastTouchDist = dist;
        }
        event.preventDefault();
    }

    onTouchEnd(): void {
        this._isDragging = false;
    }

    reset(): void {
        if (this.img) this._fitImage();
        this.confirmed = false;
        this.croppedPreview = null;
        this._draw();
        this.cdr.markForCheck();
    }

    confirmCrop(): void {
        if (!this.img) return;
        const offscreen = document.createElement('canvas');
        offscreen.width = this.OUTPUT_SIZE;
        offscreen.height = this.OUTPUT_SIZE;
        const ctx2 = offscreen.getContext('2d')!;
        const ratio = this.OUTPUT_SIZE / this.DISPLAY_SIZE;
        ctx2.drawImage(
            this.img,
            this._offsetX * ratio,
            this._offsetY * ratio,
            this.img.width * this._scale * ratio,
            this.img.height * this._scale * ratio
        );
        const base64 = offscreen.toDataURL('image/jpeg', 0.85);
        this.croppedPreview = base64;
        this.confirmed = true;
        this.imageCropped.emit(base64);
        this.cdr.markForCheck();
    }

    get zoomPercent(): number {
        if (!this.img) return 100;
        const fit = Math.max(
            this.DISPLAY_SIZE / this.img.width,
            this.DISPLAY_SIZE / this.img.height
        );
        return Math.round((this._scale / fit) * 100);
    }
}
