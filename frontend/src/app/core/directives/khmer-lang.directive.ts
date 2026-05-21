import { Directive, ElementRef, Renderer2, OnInit, OnDestroy } from '@angular/core';

@Directive({ selector: '[appKhmerLang]', standalone: true })
export class KhmerLangDirective implements OnInit, OnDestroy {
    private observer: any;
    private khmerRegex = /[\u1780-\u17FF\u19E0-\u19FF]/;

    constructor(private el: ElementRef, private renderer: Renderer2) { }

    private checkAndSet() {
        const text = (this.el.nativeElement && this.el.nativeElement.textContent) || '';
        if (this.khmerRegex.test(text)) {
            this.renderer.setAttribute(this.el.nativeElement, 'lang', 'km');
            this.renderer.addClass(this.el.nativeElement, 'kh');
        }
    }

    ngOnInit(): void {
        this.checkAndSet();
        this.observer = new MutationObserver(() => this.checkAndSet());
        this.observer.observe(this.el.nativeElement, { childList: true, subtree: true, characterData: true });
    }

    ngOnDestroy(): void {
        if (this.observer && typeof this.observer.disconnect === 'function') {
            this.observer.disconnect();
        }
    }
}
