import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

const EmailTemplates = () => {
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data } = await supabase.from('email_templates').select('*');
    setTemplates(data || []);
  };

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <Card key={template.id} className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold mb-2">{template.name}</h3>
          <p className="text-sm text-muted-foreground mb-4"><strong>Subject:</strong> {template.subject}</p>
          <pre className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap">{template.body}</pre>
        </Card>
      ))}
    </div>
  );
};

export default EmailTemplates;
