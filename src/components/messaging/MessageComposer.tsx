import type { FormEvent } from 'react';
import { SendHorizonal } from 'lucide-react';
import { Button } from '../ui/Button';

interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function MessageComposer({ value, onChange, onSubmit, disabled = false }: MessageComposerProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.trim() || disabled) {
      return;
    }

    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="card rounded-3xl p-3">
      <div className="flex items-end gap-3">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={2}
          placeholder="Write an encrypted message..."
          className="focus-ring min-h-[56px] flex-1 resize-none rounded-2xl border border-transparent bg-transparent px-4 py-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-secondary)]"
        />
        <Button type="submit" loading={disabled} trailingIcon={<SendHorizonal className="h-4 w-4" />}>
          Send
        </Button>
      </div>
    </form>
  );
}
