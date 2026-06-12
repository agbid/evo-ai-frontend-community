import { useState, useCallback, useEffect } from 'react';
import { Input } from '@evoapi/design-system';
import { Search, Loader2, User, X } from 'lucide-react';
import { contactsService } from '@/services/contacts';
import type { Contact } from '@/types/contacts';
import { useLanguage } from '@/hooks/useLanguage';
import { useAgentChat } from '@/contexts/agents/AgentChatContext';

export function AgentChatContactSelector() {
  const { t } = useLanguage('aiAgents');
  const { selectedContact, setSelectedContact } = useAgentChat();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const response = await contactsService.searchContacts({ q, page: 1, per_page: 10 });
      setResults(response.data || []);
    } catch (error) {
      console.error('Error searching contacts:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        search(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDropdown && !target.closest('.test-contact-selector-container')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  return (
    <div className="relative test-contact-selector-container w-full max-w-xs">
      <div className="relative">
        {selectedContact ? (
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        ) : (
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          value={selectedContact ? selectedContact.name : query}
          onChange={e => {
            setQuery(e.target.value);
            setShowDropdown(true);
            if (selectedContact) {
              setSelectedContact(null);
            }
          }}
          onFocus={() => {
            if (query.length >= 2 || results.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={t('chat.testContactPlaceholder') || 'Contato de teste (opcional)'}
          className="pl-8 pr-8 h-9 text-sm"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {selectedContact && !showDropdown && (
          <button
            type="button"
            onClick={() => {
              setSelectedContact(null);
              setQuery('');
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {results.map(contact => (
            <div
              key={contact.id}
              className="px-4 py-2 hover:bg-accent cursor-pointer border-b border-border last:border-b-0"
              onClick={() => {
                setSelectedContact(contact);
                setQuery('');
                setShowDropdown(false);
              }}
            >
              <div className="font-medium text-sm">{contact.name}</div>
              {(contact.phone_number || contact.email) && (
                <div className="text-xs text-muted-foreground">
                  {contact.phone_number || contact.email}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {showDropdown && query.length >= 2 && !loading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
          {t('chat.noContactsFound') || 'Nenhum contato encontrado'}
        </div>
      )}
    </div>
  );
}
