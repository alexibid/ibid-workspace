import { BehaviourDomain, BehaviourDomainId } from '@domain/models/behaviour-domain';

export const BEHAVIOUR_DOMAIN_CATALOGUE: readonly BehaviourDomain[] = [
  { id: 'comportamento', labelKey: 'domainComportamento', icon: 'verified' },
  { id: 'tarefas', labelKey: 'domainTarefas', icon: 'house' },
  { id: 'escola', labelKey: 'domainEscola', icon: 'book' },
  { id: 'conversas', labelKey: 'domainConversas', icon: 'people' },
  { id: 'familia', labelKey: 'domainFamilia', icon: 'favorite' },
];

export function behaviourDomainOf(id: BehaviourDomainId): BehaviourDomain {
  const domain = BEHAVIOUR_DOMAIN_CATALOGUE.find((candidate) => candidate.id === id);
  if (!domain) throw new Error(`Unknown behaviour domain "${id}".`);
  return domain;
}
