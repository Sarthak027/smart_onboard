-- Create enum for onboarding status
CREATE TYPE onboarding_status AS ENUM ('in_progress', 'completed', 'pending_review');

-- Create enum for departments
CREATE TYPE department_type AS ENUM ('engineering', 'sales', 'marketing', 'hr', 'finance', 'operations', 'other');

-- Create candidates table for onboarding
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  department department_type NOT NULL,
  designation TEXT NOT NULL,
  start_date DATE,
  employee_id TEXT UNIQUE,
  company_email TEXT UNIQUE,
  status onboarding_status DEFAULT 'in_progress',
  chat_data JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create documents table
CREATE TABLE public.candidate_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  document_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create email templates table
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public read/write for candidates (chatbot access)
CREATE POLICY "Allow public read candidates" 
  ON public.candidates FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert candidates" 
  ON public.candidates FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update candidates" 
  ON public.candidates FOR UPDATE 
  USING (true);

-- RLS Policies for documents
CREATE POLICY "Allow public read documents" 
  ON public.candidate_documents FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert documents" 
  ON public.candidate_documents FOR INSERT 
  WITH CHECK (true);

-- RLS Policies for email templates
CREATE POLICY "Allow public read templates" 
  ON public.email_templates FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert templates" 
  ON public.email_templates FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update templates" 
  ON public.email_templates FOR UPDATE 
  USING (true);

-- Create function to auto-generate employee ID
CREATE OR REPLACE FUNCTION generate_employee_id(
  p_name TEXT,
  p_department department_type
) RETURNS TEXT AS $$
DECLARE
  name_initials TEXT;
  dept_code TEXT;
  random_num TEXT;
BEGIN
  -- Get first 3 letters of first name
  name_initials := UPPER(LEFT(REGEXP_REPLACE(p_name, '\s.*', ''), 3));
  
  -- Department codes
  dept_code := CASE p_department
    WHEN 'engineering' THEN 'ENG'
    WHEN 'sales' THEN 'SAL'
    WHEN 'marketing' THEN 'MKT'
    WHEN 'hr' THEN 'HR'
    WHEN 'finance' THEN 'FIN'
    WHEN 'operations' THEN 'OPS'
    ELSE 'OTH'
  END;
  
  -- Generate random 4-digit number
  random_num := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  
  RETURN name_initials || dept_code || random_num;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate company email
CREATE OR REPLACE FUNCTION generate_company_email(
  p_name TEXT
) RETURNS TEXT AS $$
DECLARE
  email_prefix TEXT;
  random_num TEXT;
BEGIN
  -- Clean name and convert to lowercase
  email_prefix := LOWER(REGEXP_REPLACE(p_name, '\s+', '.', 'g'));
  
  -- Generate random 2-digit number for uniqueness
  random_num := FLOOR(RANDOM() * 100)::TEXT;
  
  RETURN email_prefix || random_num || '@company.com';
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, body) VALUES
  ('Welcome Email', 'Welcome to Our Company!', 'Dear {{name}},\n\nWelcome aboard! We are excited to have you join our team.\n\nYour employee ID is: {{employee_id}}\nYour company email is: {{company_email}}\n\nBest regards,\nHR Team'),
  ('Document Request', 'Document Submission Required', 'Dear {{name}},\n\nWe need you to submit the following documents:\n- ID Proof\n- Address Proof\n- Educational Certificates\n\nPlease upload them at your earliest convenience.\n\nBest regards,\nHR Team'),
  ('Onboarding Complete', 'Onboarding Process Completed', 'Dear {{name}},\n\nCongratulations! Your onboarding process is now complete.\n\nYou will start on {{start_date}} in the {{department}} department.\n\nBest regards,\nHR Team');