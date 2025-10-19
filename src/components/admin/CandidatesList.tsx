import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const CandidatesList = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    const { data } = await supabase.from('candidates').select('*').order('created_at', { ascending: false });
    setCandidates(data || []);
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {candidates.map((candidate) => (
        <Card key={candidate.id} className="p-6 shadow-soft">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold">{candidate.full_name}</h3>
              <p className="text-sm text-muted-foreground">{candidate.designation}</p>
            </div>
            <Badge variant={candidate.status === 'completed' ? 'default' : 'secondary'}>
              {candidate.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Email:</span> {candidate.email}</div>
            <div><span className="font-medium">Phone:</span> {candidate.phone}</div>
            <div><span className="font-medium">Department:</span> {candidate.department}</div>
            <div><span className="font-medium">Employee ID:</span> {candidate.employee_id}</div>
            <div><span className="font-medium">Company Email:</span> {candidate.company_email}</div>
            <div><span className="font-medium">Start Date:</span> {candidate.start_date}</div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default CandidatesList;
