"use client"

import { parameterSchema } from "@/app/(main)/api/analyst/gen-params/route";
import { CompanySelection } from "./company-selection"
import { experimental_useObject } from "ai/react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function Analyst() {
    const { object, submit } = experimental_useObject(
        {
            api: 'api/analyst/gen-params',
            schema: parameterSchema,
        }
    );

    if (object) {
        return <div className="p-4">
            <div className="font-bold text-2xl mb-4">Parameters</div>
            <div className="grid gap-4">
                {
                    object?.parameters?.map((param, index) => <Card key={index}>
                        <CardHeader>
                            <CardTitle>
                                {param?.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{param?.value}</p>
                            <p>{param?.reasoning}</p>
                        </CardContent>
                    </Card>)
                }
            </div>
        </div>
    }



    return <div className="flex flex-col min-w-0 h-dvh bg-background">
        <div className="flex-1 flex justify-center items-center">
            <CompanySelection setSelectedCompany={async (value) => {
                submit({ stock: value });
            }} />

        </div>
    </div>



}