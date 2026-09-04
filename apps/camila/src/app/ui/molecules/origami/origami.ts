import { Component, computed, input } from '@angular/core';
import { BehaviourDomainId } from '@domain/models/behaviour-domain';
import { ORIGAMI_STAGES, OrigamiFacet, origamiFor } from '@domain/data/origami-figures';

@Component({
  selector: 'camila-origami',
  standalone: true,
  templateUrl: './origami.html',
  styleUrl: './origami.scss',
})
export class OrigamiComponent {
  readonly domain = input.required<BehaviourDomainId>();
  readonly stage = input(0);
  readonly ariaLabel = input('');

  protected readonly folded = computed<readonly OrigamiFacet[]>(() =>
    origamiFor(this.domain()).facets.filter((facet) => facet.stage <= this.stage())
  );

  protected readonly pending = computed<readonly OrigamiFacet[]>(() =>
    origamiFor(this.domain()).facets.filter((facet) => facet.stage > this.stage())
  );

  protected readonly complete = computed(() => this.stage() >= ORIGAMI_STAGES);
}
