"use client"

export interface Company {
    name: string
    ticker: string
}
export function CompanySelection({ setSelectedCompany }: { setSelectedCompany: (value: Company) => void }) {
    const companies = [
        { name: "McDonald's", ticker: "MCD" },
        { name: "Coca Cola", ticker: "KO" },
        { name: "Chevron", ticker: "CVX" }

    ]
    return <div className="">
        <div className="grid sm:grid-cols-2 gap-2 w-full">
            {companies.map((company, index) => (
                <button key={index} className="border p-2 rounded-lg" onClick={() => { setSelectedCompany(company) }}>
                    <div className="font-bold">{company.name}</div>
                    <div className="text-sm text-gray-500">
                        {company.ticker}
                    </div>
                </button>
            ))}
        </div>
    </div>
}