export interface CreditRule {
  min: number;
  max: number;
  maxTerm: number;
  interest: number;
}

export const CREDIT_RULES: CreditRule[] = [
  { min: 0, max: 1000, maxTerm: 12, interest: 22.5 },
  { min: 1001, max: 2000, maxTerm: 24, interest: 21.5 },
  { min: 2001, max: 5000, maxTerm: 36, interest: 21.5 },
  { min: 5001, max: 10000, maxTerm: 60, interest: 21.5 },
  { min: 10001, max: 30000, maxTerm: 72, interest: 19 },
  { min: 30001, max: 40000, maxTerm: 84, interest: 19 },
  { min: 40001, max: 50000, maxTerm: 96, interest: 19 },
  { min: 50001, max: 200000, maxTerm: 120, interest: 19 },
];
