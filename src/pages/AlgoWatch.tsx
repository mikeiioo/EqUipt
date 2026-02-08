import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Scale, ArrowRight } from "lucide-react";

export default function AlgoWatch() {
  return (
    <div className="container py-12 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">AlgoWatch</h1>
      <p className="text-lg text-muted-foreground mb-10">
        Understanding how algorithms shape your healthcare decisions.
      </p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent p-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">What Are Risk Stratification Algorithms?</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-3">
            <p>
              Healthcare organizations use algorithms to decide which patients need extra support — such as care 
              management programs, home health visits, or specialist referrals. These tools assign "risk scores" 
              to patients, supposedly predicting who will need the most help.
            </p>
            <p>
              The promise is efficiency: direct limited resources to those who need them most. 
              But the reality can be different.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent p-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">The Cost-as-Proxy Problem</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-3">
            <p>
              Many widely-used algorithms use <strong>healthcare spending</strong> as a proxy for 
              healthcare <strong>need</strong>. The assumption is simple: sicker people cost more.
            </p>
            <p>
              But this assumption is flawed. Research has shown that due to systemic barriers — including 
              access to care, insurance coverage differences, and historical inequities — some groups of 
              patients consistently spend less on healthcare even when they are equally or more sick.
            </p>
            <p>
              When an algorithm equates lower spending with lower need, patients who already face barriers 
              to care can be deprioritized for the very programs designed to help them.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent p-2">
                <Scale className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">What Can You Do?</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-3">
            <p>
              Understanding these systems is the first step. Whether you're a patient, caregiver, clinician, 
              or advocate, you have the right to ask questions about how decisions are made about your care.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ask if an algorithm or risk score was used in your care decision</li>
              <li>Request an explanation of how the score was calculated</li>
              <li>File a formal request for an audit of the algorithm's inputs</li>
              <li>Report your experience to help identify patterns</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 text-center">
        <Link to="/kit/new">
          <Button size="lg" className="gap-2">
            Take Action — Generate an Advocacy Kit
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
