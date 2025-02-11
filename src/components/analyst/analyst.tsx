"use client"

import { useState } from "react"
import { CompanySelection } from "./company-selection"
import { useCompletion } from "ai/react";

export function Analyst() {
    const [stage, setStage] = useState<"selection" | "assumptions" | "model">("selection")
    const { completion, complete } = useCompletion({
        api: '/api/analyst/gen-params-text',
    });


    if (completion) {
        return <div className="p-4">
            {completion}
        </div>
    }



    if (stage === "assumptions") {
        return <div className="flex flex-col min-w-0 h-dvh bg-background">
            <div className="flex-1 flex justify-center items-center">

                <div className="max-w-md mx-auto grid gap-4">

                    <div className="font-bold text-lg">Assumptions</div>
                    <div>
                        <div>Growth rate: 3%</div>
                        <div>3%</div>
                        <div>Reasoning: This represents a slightly optimistic but still conservative assumption, assuming that Coca-Cola maintains its market share and successfully grows its revenue through product diversification, innovation, and geographic expansion.</div>
                    </div>
                    <div className="" onClick={() => setStage("model")}>Next</div>
                </div>

            </div>
        </div >
    }

    if (stage === "model") {
        return <div className="flex flex-col min-w-0 h-dvh bg-background">
            <div className="flex-1 flex justify-center items-center">
                <div>
                    <div className="text-2xl font-bold">YOUR MODEL HERE</div>
                    <div onClick={() => {
                        setStage("selection")
                    }}>Reset</div>
                </div>
            </div>
        </div >
    }



    return <div className="flex flex-col min-w-0 h-dvh bg-background">
        <div className="flex-1 flex justify-center items-center">

            <CompanySelection setSelectedCompany={async (value) => {
                await complete(value);
            }} />
        </div>
    </div>



}