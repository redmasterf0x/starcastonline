import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export type LinkItem = {
  label: string;
  url: string;
  icon?: React.ReactNode;
};

/**
 * Renders a vertical list of external links as styled buttons.
 * Used on entity pages (Band, Artist, Producer, DJ) to provide a LinkTree
 * of social / merch / music platform links.
 */
export function LinkTree({ links }: { links: LinkItem[] }) {
  if (!links || links.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mt-4">
      {links.map((link, idx) => (
        <a
          key={idx}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button variant="outline" className="w-full justify-start" asChild>
            <span className="flex items-center gap-2">
              {link.icon ?? <ExternalLink className="w-4 h-4" />}
              <span>{link.label}</span>
            </span>
          </Button>
        </a>
      ))}
    </div>
  );
}

