'use client';

import React from 'react';
import {
    Music,
    FileText,
    Users,
    Percent,
    CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardStepperProps {
    currentStep: number;
    onStepClick?: (step: number) => void;
}

export function WizardStepper({ currentStep, onStepClick }: WizardStepperProps) {
    const steps = [
        { id: 1, label: 'Media', icon: <Music size={16} /> },
        { id: 2, label: 'Metadata', icon: <FileText size={16} /> },
        { id: 3, label: 'Contributors', icon: <Users size={16} /> },
        { id: 4, label: 'Splits', icon: <Percent size={16} /> },
        { id: 5, label: 'Review', icon: <CheckCircle size={16} /> },
    ];

    return (
        <div className="flex items-center justify-between mb-12 relative px-4">
            {/* Connector Line */}
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-neutral-900 -translate-y-1/2 z-0" />

            {steps.map((step) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const isClickable = onStepClick && (isCompleted || step.id <= currentStep + 1);

                return (
                    <button
                        key={step.id}
                        onClick={() => isClickable && onStepClick(step.id)}
                        disabled={!isClickable}
                        className={cn(
                            "relative z-10 flex flex-col items-center group transition-all",
                            !isClickable && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                            isActive ? "bg-emerald-500 border-emerald-500 text-black scale-110 shadow-[0_0_20px_rgba(16,185,129,0.4)]" :
                                isCompleted ? "bg-neutral-800 border-emerald-500 text-emerald-500" :
                                    "bg-neutral-950 border-neutral-800 text-neutral-600 group-hover:border-neutral-700"
                        )}>
                            {isCompleted ? <CheckCircle size={20} /> : step.icon}
                        </div>
                        <span className={cn(
                            "absolute -bottom-6 text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap",
                            isActive ? "text-emerald-500" : "text-neutral-500"
                        )}>
                            {step.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
