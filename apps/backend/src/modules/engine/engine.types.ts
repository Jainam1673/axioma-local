export interface PartnerWithdrawalInput {
  partnerId: string;
  shareRatio: number;
  alreadyWithdrawn: string | number;
}

export interface ClientProfitabilityInput {
  clientId: string;
  realizedRevenue: string | number;
  paidExpense?: string | number;
  directExpenses?: string | number;
  allocatedSalary?: string | number;
  proportionalOverhead?: string | number;
}

export interface ClientProfitabilityOutput {
  realizedRevenue: string;
  estimatedCost: string;
  marginAmount: string;
  marginPercent: string;
}

export interface RiskStatus {
  profitHealth: "healthy" | "caution" | "critical";
  withdrawalHealth: "safe" | "warning" | "alert";
  runwayHealth: "stable" | "monitor" | "critical";
  overdrawn: boolean;
}

export interface PartnerBreakdownItem {
  partnerId: string;
  allowedTotal: string;
  withdrawnSoFar: string;
  remainingLimit: string;
}

export interface FinancialEngineInput {
  realizedRevenue: string | number;
  paidExpenses: string | number;
  salaries: string | number;
  fixedMonthlyExpense: string | number;
  bufferMonths: number;
  recurringExpenses?: string | number;
  avgFixedCosts?: string | number;
  totalWithdrawn?: string | number;
  cashBalance?: string | number;
  partners: PartnerWithdrawalInput[];
  clients?: ClientProfitabilityInput[];
}

export interface FinancialEngineOutput {
  realizedRevenue: string;
  operatingProfit: string;
  realNetProfit: string;
  monthlyBurn: string;
  requiredBuffer: string;
  distributablePool: string;
  remainingPool: string;
  safeWithdrawalCeiling: string;
  runwayMonths: string;
  partnerBreakdown: PartnerBreakdownItem[];
  riskStatus: RiskStatus;
  partnerMaxWithdrawal: Record<string, string>;
  clientMargin: Record<string, ClientProfitabilityOutput>;
}

export interface WithdrawalSimulationInput {
  requestedAmount: string | number;
  partnerId: string;
  currentCashBalance: string | number;
  monthlyBurn: string | number;
  remainingPool: string | number;
}

export interface WithdrawalSimulationOutput {
  blocked: boolean;
  decision: "allow" | "block";
  riskLevel: "safe" | "medium" | "high";
  newCashBalance: string;
  newRunwayMonths: string;
  newRemainingPool: string;
  reason: string;
}
