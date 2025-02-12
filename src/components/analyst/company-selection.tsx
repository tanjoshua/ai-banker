"use client"


export function CompanySelection({ setSelectedCompany }: { setSelectedCompany: (value: string) => void }) {
    const companies = [
        { name: "McDonald's", ticker: "NYSE: MCD" },
        { name: "Coca Cola", ticker: "NYSE: KO" },
        { name: "Chevron", ticker: "NYSE: CVX" }

    ]
    return <div className="">
        <div className="grid sm:grid-cols-2 gap-2 w-full">
            {companies.map((company, index) => (
                <button key={index} className="border p-2 rounded-lg" onClick={() => { setSelectedCompany(company.name) }}>
                    <div className="font-bold">{company.name}</div>
                    <div className="text-sm text-gray-500">
                        {company.ticker}
                    </div>
                </button>
            ))}
        </div>
    </div>
}