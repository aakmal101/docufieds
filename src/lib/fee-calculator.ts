
export function calculateTradeLicenseFee(capitalInvestment: number): number {
    if (capitalInvestment <= 50000) return 500;
    if (capitalInvestment <= 200000) return 1000;
    if (capitalInvestment <= 500000) return 2000;
    if (capitalInvestment <= 1000000) return 3000;
    if (capitalInvestment <= 5000000) return 5000;
    return 10000;
}

export function calculateTotalFee(capitalInvestment: number, isUrgent: boolean = false): {
    licenseFee: number;
    signboardFee: number;
    vat: number;
    urgentFee: number;
    total: number;
} {
    const licenseFee = calculateTradeLicenseFee(capitalInvestment);
    const signboardFee = 200; // Fixed fee
    const subTotal = licenseFee + signboardFee;
    const vat = subTotal * 0.15; // 15% VAT
    let urgentFee = 0;

    if (isUrgent) {
        // Urgent surcharge logic (e.g., specific percentage or flat fee, assuming flat fee for now or based on rules)
        // For now, let's assume a standard urgent fee or percentage if not specified
        // The requirement says "plus urgent surcharge if applicable". Let's assume a reasonable surcharge or 0 if not defined.
        // Let's add 2000 BDT for urgent processing as a placeholder or based on common practice
        urgentFee = 2000;
    }

    const total = subTotal + vat + urgentFee;

    return {
        licenseFee,
        signboardFee,
        vat,
        urgentFee,
        total
    };
}
