import { useState, useEffect, useRef } from "react";
import { Send, Upload, Loader2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Message {
  role: "bot" | "user";
  content: string;
}

interface CandidateData {
  fullName?: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  startDate?: string;
}

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Hello! Welcome to our onboarding process. I'm here to help you get started. What's your full name?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [candidateData, setCandidateData] = useState<CandidateData>({});
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const questions = [
    "What's your full name?",
    "What's your email address?",
    "What's your phone number?",
    "Which department will you be joining? (engineering, sales, marketing, hr, finance, operations, other)",
    "What's your designation/job title?",
    "When will you be starting?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    inputRef.current?.focus();
  }, [messages]);

  const saveCandidate = async (data: CandidateData) => {
    try {
      const department = data.department as "engineering" | "sales" | "marketing" | "hr" | "finance" | "operations" | "other";
      
      const { data: empIdData } = await supabase.rpc('generate_employee_id', {
        p_name: data.fullName!,
        p_department: department
      });

      const { data: emailData } = await supabase.rpc('generate_company_email', {
        p_name: data.fullName!
      });

      const { error } = await supabase.from('candidates').insert([{
        full_name: data.fullName!,
        email: data.email!,
        phone: data.phone,
        department: department,
        designation: data.designation!,
        start_date: data.startDate,
        employee_id: empIdData,
        company_email: emailData,
        status: 'completed' as const,
        chat_data: messages as any
      }]);

      if (error) throw error;

      // Save to Google Sheets
      try {
        await supabase.functions.invoke('save-to-sheets', {
          body: {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            department: department,
            designation: data.designation,
            startDate: data.startDate,
            employeeId: empIdData,
            companyEmail: emailData
          }
        });
      } catch (sheetError) {
        console.error('Error saving to Google Sheets:', sheetError);
      }

      setMessages(prev => [...prev, {
        role: "bot",
        content: `Thank you! Your onboarding is complete! 🎉\n\nYour Details:\n• Employee ID: ${empIdData}\n• Company Email: ${emailData}\n• Start Date: ${data.startDate}\n\nHR will contact you soon with next steps!`
      }]);

      toast({
        title: "Success!",
        description: "Your onboarding information has been saved.",
      });
    } catch (error) {
      console.error('Error saving candidate:', error);
      toast({
        title: "Error",
        description: "Failed to save your information. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSend = async (value?: string) => {
    const inputValue = value || input;
    if (!inputValue.trim() && currentStep !== 3 && currentStep !== 5) return;

    const userMessage: Message = { role: "user", content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Store data based on current step
    const newData = { ...candidateData };
    switch (currentStep) {
      case 0:
        newData.fullName = inputValue;
        break;
      case 1:
        newData.email = inputValue;
        break;
      case 2:
        newData.phone = inputValue;
        break;
      case 3:
        newData.department = inputValue.toLowerCase() as any;
        break;
      case 4:
        newData.designation = inputValue;
        break;
      case 5:
        newData.startDate = inputValue;
        break;
    }
    setCandidateData(newData);

    setInput("");

    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setMessages(prev => [...prev, {
          role: "bot",
          content: questions[currentStep + 1]
        }]);
        setCurrentStep(prev => prev + 1);
      } else {
        saveCandidate(newData);
      }
      setIsLoading(false);
    }, 500);
  };

  const handleDepartmentSelect = (value: string) => {
    handleSend(value);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      setSelectedDate(date);
      setIsDatePickerOpen(false);
      handleSend(formattedDate);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl h-[600px] flex flex-col shadow-medium">
        <div className="bg-gradient-primary p-6 rounded-t-xl">
          <h1 className="text-2xl font-bold text-white">Candidate Onboarding</h1>
          <p className="text-white/90 text-sm mt-1">Let's get you started with your journey</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 animate-in slide-in-from-bottom-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "bg-chat-bot text-foreground border border-border"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-chat-bot rounded-2xl px-4 py-3 border border-border">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border bg-card">
          {currentStep >= questions.length ? (
            <div className="text-center text-muted-foreground py-2">
              Onboarding completed! Thank you.
            </div>
          ) : currentStep === 3 ? (
            <Select onValueChange={handleDepartmentSelect} disabled={isLoading}>
              <SelectTrigger className="w-full bg-chat-input">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          ) : currentStep === 5 ? (
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-chat-input",
                    !selectedDate && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          ) : (
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your answer..."
                className="flex-1 bg-chat-input"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="bg-primary hover:bg-primary/90 shadow-soft"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Chatbot;
