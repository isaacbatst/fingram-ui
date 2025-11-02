import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import type { RunToolApprovalItem } from '@openai/agents';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';

type Item = ReturnType<RunToolApprovalItem['toJSON']>;

type TransactionArgs = {
  transaction: {
    amount: number;
    date: string;
    type: 'income' | 'expense';
    description: string;
    categoryId: string;
    categoryName: string;
  };
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

function TransactionDetails({ args }: { args: TransactionArgs }) {
  if (!args?.transaction) {
    return null;
  }

  const { transaction } = args;
  const isExpense = transaction.type === 'expense';
  const isIncome = transaction.type === 'income';

  return (
    <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Tipo:</span>
        <span
          className={`text-sm`}
        >
          {isExpense ? '💰 Despesa' : isIncome ? '💵 Receita' : transaction.type}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Valor:</span>
        <span
          className={`text-base font-bold ${
            isExpense ? 'text-red-600' : isIncome ? 'text-green-600' : 'text-gray-600'
          }`}
        >
          {isExpense ? '-' : '+'} {formatCurrency(transaction.amount)}
        </span>
      </div>

      {transaction.description && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Descrição:</span>
          <span className="text-sm text-gray-900">{transaction.description}</span>
        </div>
      )}

      {transaction.categoryName && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Categoria:</span>
          <span className="text-sm text-gray-900">{transaction.categoryName}</span>
        </div>
      )}

      {transaction.date && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Data:</span>
          <span className="text-sm text-gray-900">{formatDate(transaction.date)}</span>
        </div>
      )}
    </div>
  );
}

function ToolApprovalEntry({
  approval,
  onApprove,
  onReject,
  decision,
}: {
  approval: Item;
  onApprove: () => void;
  onReject: () => void;
  decision: 'approved' | 'rejected' | undefined;
}) {
  if (approval.rawItem?.type !== 'function_call') {
    return null;
  }

  let parsedArgs: TransactionArgs | null = null;
  try {
    const parsed = JSON.parse(approval.rawItem?.arguments || '{}');
    if (parsed && typeof parsed === 'object') {
      parsedArgs = parsed as TransactionArgs;
    }
  } catch {
    // If parsing fails, we'll show raw JSON in dev mode
  }

  const functionName = approval.rawItem?.name;
  const isAddTransaction = functionName === 'addTransaction';

  return (
    <div key={approval.rawItem?.id} className="flex flex-col gap-3">
      <h3 className="font-medium text-base">
        {isAddTransaction ? 'Adicionar Transação' : `Tool: ${functionName}`}
      </h3>
      
      {isAddTransaction && parsedArgs?.transaction ? (
        <TransactionDetails args={parsedArgs} />
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50">
          <p className="text-sm text-gray-700">
            {parsedArgs 
              ? `Ação: ${functionName}` 
              : 'Detalhes da ação não disponíveis'}
          </p>
        </div>
      )}

      {decision === undefined && (
        <div className="flex gap-2">
          <Button onClick={onApprove}>
            Aprovar
          </Button>
          <Button variant='secondary' onClick={onReject}>
            Rejeitar
          </Button>
        </div>
      )}
      {decision === 'approved' && (
        <p className="text-sm text-green-700 font-medium">✔︎ Aprovado</p>
      )}
      {decision === 'rejected' && (
        <p className="text-sm text-red-600 font-medium">✖︎ Rejeitado</p>
      )}
    </div>
  );
}

/**
 * This component just renders all of the approval requests and tracks whether they were approved
 * or not by storing the callId in a decision Map with `approved` or `rejected` as the value.
 * Once all the approvals are done, we will call the onDone function to let the parent component
 * trigger the next run.
 */
export function Approvals({
  approvals,
  onDone,
}: {
  approvals: ReturnType<RunToolApprovalItem['toJSON']>[];
  onDone: (decisions: Map<string, 'approved' | 'rejected'>) => void;
}) {
  const [decisions, setDecisions] = useState<
    Map<string, 'approved' | 'rejected'>
  >(new Map());
  const [isOpen, setIsOpen] = useState(approvals.length > 0);

  useEffect(() => {
    setDecisions(new Map());
    if (approvals.length > 0) {
      setIsOpen(true);
    }
  }, [approvals]);

  function handleApprove(approval: Item) {
    setDecisions((prev) => {
      if (approval.rawItem?.type !== 'function_call') {
        return prev;
      }
      const newDecisions = new Map(prev);
      newDecisions.set(approval.rawItem?.callId ?? '', 'approved');
      return newDecisions;
    });
  }

  function handleReject(approval: Item) {
    setDecisions((prev) => {
      if (approval.rawItem?.type !== 'function_call') {
        return prev;
      }
      const newDecisions = new Map(prev);
      newDecisions.set(approval.rawItem?.callId ?? '', 'rejected');
      return newDecisions;
    });
  }

  function handleDone() {
    onDone(decisions);
    setIsOpen(false);
  }

  if (approvals.length === 0) {
    return null;
  }
  function onOpenChange(open: boolean) {
    setIsOpen(open);
  }
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aprovação Necessária</DialogTitle>
          <DialogDescription>
            O agente está solicitando aprovação para a{approvals.length > 1 ? 's' : ''} seguinte{approvals.length > 1 ? 's' : ''} ação{approvals.length > 1 ? 'ões' : ''}:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 min-w-0 max-h-[60vh] overflow-y-auto">
          {approvals.map((approval) =>
            approval.rawItem?.type === 'function_call' ? (
              <ToolApprovalEntry
                key={approval.rawItem?.callId}
                approval={approval}
                decision={decisions.get(approval.rawItem?.callId ?? '')}
                onApprove={() => handleApprove(approval)}
                onReject={() => handleReject(approval)}
              />
            ) : null,
          )}
        </div>
        <DialogFooter>
          <Button
            type="submit"
            disabled={decisions.size !== approvals.length}
            onClick={handleDone}
          >
            Concluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}