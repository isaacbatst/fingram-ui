import { useSearchParams } from "./useSearchParams";

/**
 * Cartões moram na aba Estratos. A tela aberta vive na URL, para que avisos
 * de outras abas (Gastos, a gaveta de uma transação, a triagem) levem direto
 * a um cartão ou a uma fatura, e o voltar do navegador funcione.
 *
 * - `cartao=<id>`: o cartão e suas faturas
 * - `fatura=<id>`: o detalhe de uma fatura (compras, pagamentos, conferência)
 * - `cartoes=duplicatas` | `cartoes=reprocessar`
 */
export type CardScreen =
  | { kind: "list" }
  | { kind: "card"; cardId: string }
  | { kind: "invoice"; invoiceId: string; cardId: string | null }
  | { kind: "duplicates" }
  | { kind: "reprocess" };

export function readCardScreen(params: URLSearchParams): CardScreen {
  const invoiceId = params.get("fatura");
  if (invoiceId) return { kind: "invoice", invoiceId, cardId: params.get("cartao") };
  const cardId = params.get("cartao");
  if (cardId) return { kind: "card", cardId };
  const section = params.get("cartoes");
  if (section === "duplicatas") return { kind: "duplicates" };
  if (section === "reprocessar") return { kind: "reprocess" };
  return { kind: "list" };
}

export const CLEAR_CARD_PARAMS = { cartao: "", fatura: "", cartoes: "" };

export function useCardNav() {
  const [searchParams, setSearchParams] = useSearchParams();
  return {
    screen: readCardScreen(searchParams),
    openCard: (cardId: string) =>
      setSearchParams({ ...CLEAR_CARD_PARAMS, aba: "estratos", cartao: cardId }),
    openInvoice: (invoiceId: string, cardId?: string) =>
      setSearchParams({
        ...CLEAR_CARD_PARAMS,
        aba: "estratos",
        fatura: invoiceId,
        cartao: cardId ?? "",
      }),
    openDuplicates: () =>
      setSearchParams({ ...CLEAR_CARD_PARAMS, aba: "estratos", cartoes: "duplicatas" }),
    openReprocess: () =>
      setSearchParams({ ...CLEAR_CARD_PARAMS, aba: "estratos", cartoes: "reprocessar" }),
    backToEstratos: () => setSearchParams({ ...CLEAR_CARD_PARAMS }),
    /** De outra aba: a lista de Estratos, onde ficam os cartões. */
    openCards: () => setSearchParams({ ...CLEAR_CARD_PARAMS, aba: "estratos" }),
    openImport: () => setSearchParams({ ...CLEAR_CARD_PARAMS, aba: "input", entrada: "importar" }),
  };
}
