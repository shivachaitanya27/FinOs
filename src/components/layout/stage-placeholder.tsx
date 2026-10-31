import React from "react";
import Link from "next/link";
import { LucideIcon, ArrowLeft, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface StagePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  targetStage?: number;
  plannedFeatures: string[];
}

export function StagePlaceholder({
  title,
  description,
  icon: Icon,
  targetStage = 2,
  plannedFeatures,
}: StagePlaceholderProps) {
  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-navy-900/90 shadow-fin-card">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{title}</h1>
              <Badge variant="outline" className="text-[10px]">
                Stage {targetStage} Roadmap
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>

        <Link href="/">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Overview
          </Button>
        </Link>
      </div>

      {/* Main Feature Spec Preview Card */}
      <Card className="border-dashed border-slate-700/80">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-finteal-950/80 border border-finteal-800 text-finteal-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Module Architecture Ready for Stage {targetStage}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Database models and schema relationships for this module have already been created
                in Prisma ORM and SQLite. Advanced interactive views and AI processing pipelines will be activated in Stage {targetStage}.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Planned Capabilities in Next Release:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {plannedFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2.5 text-slate-300"
                >
                  <CheckCircle2 className="h-4 w-4 text-finteal-400 flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
