import { Directive, ElementRef, OnInit, Renderer2, RendererStyleFlags2, inject } from '@angular/core';

@Directive({
  selector: '[ibidHandDrawn]',
  standalone: true
})
export class HandDrawnDirective implements OnInit {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  ngOnInit(): void {
    const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

    const leanLeft = Math.random() > 0.5;

    const h1 = r(88, 97);
    const h2 = r(88, 97);
    const l1 = r(3, 12);
    const l2 = r(3, 12);

    const tl1 = leanLeft ? h1 : l1;
    const tr1 = leanLeft ? l1 : h1;
    const br1 = leanLeft ? h2 : l2;
    const bl1 = leanLeft ? l2 : h2;

    const tl2 = leanLeft ? l1 : h1;
    const tr2 = leanLeft ? h1 : l1;
    const br2 = leanLeft ? l2 : h2;
    const bl2 = leanLeft ? h2 : l2;

    const value = `${tl1}% ${tr1}% ${br1}% ${bl1}% / ${tl2}% ${tr2}% ${br2}% ${bl2}%`;

    this.renderer.addClass(this.el.nativeElement, 'o-hand-drawn');
    this.renderer.setStyle(
      this.el.nativeElement,
      'border-radius',
      value,
      RendererStyleFlags2.DashCase
    );
  }
}
