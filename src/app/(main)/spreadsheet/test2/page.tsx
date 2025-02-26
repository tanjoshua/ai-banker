import { DCF } from "@/components/spreadsheet/dcf";

export default function SpreadsheetTestPage() {
    return <DCF ticker="AAPL" params={{
        revenueGrowth: 0.1,
        cogsMargin: 0.2,
        sgaMargin: 0.3,
        daCapex: 0.4,
        taxRate: 0.5,
        salesIntensity: 0.6,
    }} />
}