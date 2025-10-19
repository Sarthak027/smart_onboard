import { useState, useEffect, useRef } from "react";
import { Send, Loader2, CalendarIcon } from "lucide-react";
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

  const saveCandidate = async (data: CandidateData, retries = 2) => {
    try {
      const department = data.department as
        | "engineering"
        | "sales"
        | "marketing"
        | "hr"
        | "finance"
        | "operations"
        | "other";

      // --- Validate Supabase RPC responses ---
      const { data: empIdData, error: empIdError } = await supabase.rpc("generate_employee_id", {
        p_name: data.fullName!,
        p_department: department,
      });
      if (empIdError) console.warn("Employee ID RPC failed:", empIdError);

      const { data: emailData, error: emailError } = await supabase.rpc("generate_company_email", {
        p_name: data.fullName!,
      });
      if (emailError) console.warn("Company Email RPC failed:", emailError);

      const employeeId = empIdData || `TEMP-${Math.floor(Math.random() * 10000)}`;
      const companyEmail =
        emailData || `${data.fullName?.toLowerCase().replace(/\s+/g, ".")}@example.com`;

      // --- Save to Supabase table ---
      const { error: insertError } = await supabase.from("candidates").insert([
        {
          full_name: data.fullName!,
          email: data.email!,
          phone: data.phone,
          department: department,
          designation: data.designation!,
          start_date: data.startDate,
          employee_id: employeeId,
          company_email: companyEmail,
          status: "completed" as const,
          chat_data: messages as any,
        },
      ]);

      if (insertError) throw insertError;

      // --- Optional: Save to Google Sheets ---
      try {
        await supabase.functions.invoke("save-to-sheets", {
          body: {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            department: department,
            designation: data.designation,
            startDate: data.startDate,
            employeeId,
            companyEmail,
          },
        });
      } catch (sheetError) {
        console.error("Google Sheets sync failed:", sheetError);
      }

      // --- Success message ---
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: `Thank you! Your onboarding is complete 🎉\n\nYour Details:\n• Employee ID: ${employeeId}\n• Company Email: ${companyEmail}\n• Start Date: ${data.startDate}\n\nHR will contact you soon.`,
        },
      ]);

      toast({
        title: "Success!",
        description: "Your onboarding information has been saved.",
      });
    } catch (error) {
      console.error("Error saving candidate:", error);

      if (retries > 0) {
        console.warn("Retrying saveCandidate...");
        await new Promise((res) => setTimeout(res, 1000));
        return saveCandidate(data, retries - 1);
      }

      toast({
        title: "Error",
        description: "Failed to save your information. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleSend = async (value?: string) => {
    const inputValue = value || input;
    if (!inputValue.trim() && currentStep !== 3 && currentStep !== 5) return;

    const userMessage: Message = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

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
        setMessages((prev) => [
          ...prev,
          { role: "bot", content: questions[currentStep + 1] },
        ]);
        setCurrentStep((prev) => prev + 1);
      } else {
        saveCandidate(newData);
      }
      setIsLoading(false);
    }, 500);
  };

  const handleDepartmentSelect = (value: string) => handleSend(value);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
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
          <p className="text-white/90 text-sm mt-1">
            Let's get you started with your journey
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-chat-bot text-foreground border"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-chat-bot rounded-2xl px-4 py-3 border">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t bg-card">
          {currentStep >= questions.length ? (
            <div className="text-center text-muted-foreground py-2">
              Onboarding completed! Thank you.
            </div>
          ) : currentStep === 3 ? (
            <Select onValueChange={handleDepartmentSelect} disabled={isLoading}>
              <SelectTrigger className="w-full bg-chat-input">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
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
              <PopoverContent className="w-auto p-0 bg-popover" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
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
                className="bg-primary hover:bg-primary/90"
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
