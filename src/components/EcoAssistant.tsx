import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Leaf, Sparkles, HelpCircle, FileText, User, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
    id: 'init',
    role: 'assistant',
    content: "Hi! I'm GreenGen 🌿. I'm here to help with your fleet, account, or carbon optimization. How can I assist you today?",
    timestamp: new Date(),
};

// Enhanced Knowledge Base for "Support" & "Wider Queries"
const KNOWLEDGE_BASE = [
    // --- Carbon & Optimization ---
    {
        keywords: ['optimize', 'reduce', 'improve', 'efficiency'],
        response: "To optimize your fleet, I recommend rightsizing your 'Training-Cluster-1'. It's utilizing only 20% waiting capacity. Switching to a smaller instance could save ~40% energy. You can also enable 'Green Only' mode in Settings."
    },
    {
        keywords: ['carbon', 'emissions', 'footprint', 'co2'],
        response: "Your total carbon footprint is currently 12.5 tons/month. The majority (65%) comes from the 'us-east-1' region. Consider migrating workloads to 'eu-north-1' (Sweden) to leverage 100% renewable energy."
    },
    {
        keywords: ['region', 'location', 'move'],
        response: "I strongly suggest moving non-latency-sensitive workloads to 'eu-north-1' or 'ca-central-1'. These regions have the lowest carbon intensity (< 20g CO2/kWh) right now."
    },
    {
        keywords: ['certificates', 'credits', 'offset', 'rec'],
        response: "You have 5 pending Renewable Energy Certificates (RECs) available for minting. You can verify and burn them in the Certificates page to offset your footprint on visual chain."
    },

    // --- Account & Billing Support ---
    {
        keywords: ['password', 'reset', 'login'],
        response: "You can reset your password from the Settings page under 'Security', or click 'Forgot Password' on the login screen. Need me to send a reset link?"
    },
    {
        keywords: ['bill', 'invoice', 'payment', 'cost', 'pricing'],
        response: "Your current billing cycle ends on Feb 28th. You are on the 'Pro Planet' plan ($49/mo). You can view your latest invoice in Settings > Billing."
    },
    {
        keywords: ['upgrade', 'plan', 'subscription'],
        response: "To upgrade to the Enterprise plan for unlimited nodes and API access, please visit the Billing section. It includes 24/7 dedicated carbon auditing."
    },

    // --- Technical & API ---
    {
        keywords: ['api', 'key', 'token', 'sdk'],
        response: "You can manage your API keys in Settings > Developer. We offer a Python SDK and a Node.js client. Check out the docs at docs.ecocompute.io/api."
    },
    {
        keywords: ['deploy', 'model', 'upload'],
        response: "To deploy a new model, navigate to the 'Models' page and click 'New Deployment'. We support PyTorch, TensorFlow, and ONNX formats directly."
    },
    {
        keywords: ['delete', 'remove', 'account'],
        response: "We're sorry to see you go. You can delete your account from Settings > Danger Zone. Note that this action is irreversible and will scrub your data."
    },

    // --- General ---
    {
        keywords: ['hello', 'hi', 'hey', 'start'],
        response: "Hello there! Ready to make your AI greener? Ask me about your fleet's efficiency, your account, or how to use the platform."
    },
    {
        keywords: ['help', 'support', 'assist'],
        response: "I can help with: \n1. Optimization Advice 🌿\n2. Billing & Account Issues 💳\n3. Technical Deployment 🔧\n4. Platform Navigation 🧭\n\nWhat do you need?"
    }
];

const SUGGESTED_QUESTIONS = [
    "How do I reduce emissions?",
    "Where is my API key?",
    "Reset my password",
    "Upgrade my plan"
];

const EcoAssistant = () => {
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping]);

    const handleSendMessage = (textOverride?: string) => {
        const text = textOverride || inputValue;
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        // Simulate AI Latency & Thinking
        setTimeout(() => {
            const lowerInput = text.toLowerCase();
            let response = "I'm not quite sure about that. I recommend checking our Documentation or contacting human support at support@ecocompute.io. Can I help with anything else?";

            const match = KNOWLEDGE_BASE.find(kb =>
                kb.keywords.some(k => lowerInput.includes(k))
            );

            if (match) {
                response = match.response;
            }

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1200);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSendMessage();
    };

    return (
        <Card className="w-full h-full shadow-none border-0 flex flex-col bg-background">
            {/* Header */}
            <div className="p-4 border-b bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Leaf className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">GreenGen Support</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Online
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-background/50">
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex gap-2 max-w-[85%]",
                                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                            )}
                        >
                            <Avatar className="h-8 w-8 border shrink-0">
                                {msg.role === 'assistant' ? (
                                    <>
                                        <AvatarImage src="/eco-bot.png" />
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            <Sparkles className="h-4 w-4" />
                                        </AvatarFallback>
                                    </>
                                ) : (
                                    <AvatarFallback className="bg-muted">U</AvatarFallback>
                                )}
                            </Avatar>
                            <div
                                className={cn(
                                    "p-3 rounded-2xl text-sm whitespace-pre-wrap",
                                    msg.role === 'user'
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-muted rounded-tl-none border border-border"
                                )}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex gap-2 max-w-[85%]">
                            <Avatar className="h-8 w-8 border shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    <Sparkles className="h-4 w-4" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="bg-muted p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" />
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Quick Suggestions */}
            {messages.length < 3 && (
                <div className="px-4 py-2 bg-background/50 backdrop-blur-sm border-t border-b flex gap-2 overflow-x-auto no-scrollbar">
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                        <Badge
                            key={i}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary/10 shrink-0 font-normal"
                            onClick={() => handleSendMessage(q)}
                        >
                            {q}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="p-3 bg-background">
                <div className="relative flex items-center gap-2">
                    <Input
                        placeholder="Ask about emissions, billing, or account..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="pr-10"
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1 h-8 w-8 text-primary hover:bg-primary/10"
                        onClick={() => handleSendMessage()}
                        disabled={!inputValue.trim()}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default EcoAssistant;
