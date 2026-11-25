import { ManagedText, ManagedAnchor, siteText } from '../cms/PublicContent';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCompactViewport } from '../hooks/useCompactViewport';
import { useSiteLocation } from '../routing/navigation';

export function MobileHomeSection({ sectionId, title, description, children }: { sectionId: string; title: string; description: string; children: ReactNode }) {
  const compact = useCompactViewport();
  const { hash } = useSiteLocation();
  const [expanded, setExpanded] = useState(false);
  const [wasOpened, setWasOpened] = useState(false);
  const panelId = useId();
  const shell = useRef<HTMLDivElement>(null);
  useEffect(() => { if (hash === `#${sectionId}`) setExpanded(true); }, [hash, sectionId]);
  useEffect(() => { if (expanded) setWasOpened(true); }, [expanded]);
  if (!compact) return <>{children}</>;
  return <div className="fc-mobile-home-section" ref={shell}>
    {!expanded && <section id={wasOpened ? undefined : sectionId} className="fc-mobile-preview"><h2><ManagedText value={title}/></h2><p><ManagedText value={description}/></p></section>}
    <button type="button" className="fc-mobile-section-toggle" aria-expanded={expanded} aria-controls={panelId} onClick={() => {
      if (expanded) shell.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
      setExpanded(value => !value);
    }}><ManagedText value={expanded ? `بستن ${title}` : `مشاهده ${title}`}/><ChevronDown size={20} aria-hidden="true"/></button>
    <div id={panelId} hidden={!expanded}><ManagedText value={(expanded || wasOpened) && children}/></div>
  </div>;
}
