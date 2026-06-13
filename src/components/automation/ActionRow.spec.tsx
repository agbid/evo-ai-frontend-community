import { describe, it, expect, vi } from 'vitest';
import { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  automationRuleSchema,
  type AutomationRuleFormData,
} from '@/pages/Customer/Automation/registries';
import ActionRow from './ActionRow';
import type { AutomationFormData } from '@/hooks/automation/useAutomationFormData';

const emptyFormData: AutomationFormData = {
  inboxes: [],
  agents: [],
  teams: [],
  labels: [],
  pipelines: [],
  pipelineStages: [],
  priorities: [],
  statuses: [],
  messageTypes: [],
  cannedResponses: [],
  messageTemplates: [],
};

function Wrapper({ defaultValues }: { defaultValues: AutomationRuleFormData }) {
  const methods = useForm<AutomationRuleFormData>({
    resolver: zodResolver(automationRuleSchema),
    defaultValues,
  });
  return (
    <FormProvider {...methods}>
      <ActionRow
        control={methods.control}
        index={0}
        formData={emptyFormData}
        onRemove={() => {}}
        onActionChange={() => {}}
      />
    </FormProvider>
  );
}

function HarnessWithParamsWatch({
  defaultValues,
  onActionParamsChange,
}: {
  defaultValues: AutomationRuleFormData;
  onActionParamsChange: (params: unknown) => void;
}) {
  const methods = useForm<AutomationRuleFormData>({
    resolver: zodResolver(automationRuleSchema),
    defaultValues,
  });

  useEffect(() => {
    const subscription = methods.watch((value) => {
      onActionParamsChange(value.actions?.[0]?.action_params);
    });
    return () => subscription.unsubscribe();
  }, [methods, onActionParamsChange]);

  return (
    <FormProvider {...methods}>
      <ActionRow
        control={methods.control}
        index={0}
        formData={emptyFormData}
        onRemove={() => {}}
        onActionChange={() => {}}
      />
    </FormProvider>
  );
}

describe('ActionRow', () => {
  it('renders for a send_message action with the action select and remove button', () => {
    const defaults: AutomationRuleFormData = {
      name: 'Test',
      description: '',
      event_name: 'conversation_created',
      active: true,
      mode: 'simple',
      conditions: [],
      actions: [{ action_name: 'send_message', action_params: ['hi'] }],
    };
    const { container } = render(<Wrapper defaultValues={defaults} />);
    expect(container.querySelector('button[aria-label*="remove"]')).toBeTruthy();
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('shows the skip-agent checkbox for send_message on conversation_created', () => {
    const defaults: AutomationRuleFormData = {
      name: 'Test',
      description: '',
      event_name: 'conversation_created',
      active: true,
      mode: 'simple',
      conditions: [],
      actions: [{ action_name: 'send_message', action_params: ['hi'] }],
    };
    render(<Wrapper defaultValues={defaults} />);
    expect(screen.getByText(/form\.fields\.actionRow\.params\.send_message_skip_agent/)).toBeTruthy();
    expect(screen.getByRole('checkbox')).toBeTruthy();
  });

  it('hides the skip-agent checkbox for send_message on other events', () => {
    const defaults: AutomationRuleFormData = {
      name: 'Test',
      description: '',
      event_name: 'conversation_updated',
      active: true,
      mode: 'simple',
      conditions: [],
      actions: [{ action_name: 'send_message', action_params: ['hi'] }],
    };
    render(<Wrapper defaultValues={defaults} />);
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('toggling the skip-agent checkbox sets action_params[1] to true while keeping the message text', async () => {
    const defaults: AutomationRuleFormData = {
      name: 'Test',
      description: '',
      event_name: 'conversation_created',
      active: true,
      mode: 'simple',
      conditions: [],
      actions: [{ action_name: 'send_message', action_params: ['hi'] }],
    };
    const onActionParamsChange = vi.fn();
    render(<HarnessWithParamsWatch defaultValues={defaults} onActionParamsChange={onActionParamsChange} />);

    await userEvent.click(screen.getByRole('checkbox'));

    expect(onActionParamsChange).toHaveBeenCalledWith(['hi', true]);
  });

  it('renders the no-params placeholder for resolve_conversation', () => {
    const defaults: AutomationRuleFormData = {
      name: 'Test',
      description: '',
      event_name: 'conversation_created',
      active: true,
      mode: 'simple',
      conditions: [],
      actions: [{ action_name: 'resolve_conversation', action_params: [] }],
    };
    render(<Wrapper defaultValues={defaults} />);
    expect(screen.getByText(/form\.fields\.actionRow\.noParams/)).toBeTruthy();
  });
});
