import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Zap, Code2, CheckCircle, Flame, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { optimizeCode } from '@/lib/codeOptimizer';

export const GreenCodeRefiner = () => {
    const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete'>('idle');
    const [inputCode, setInputCode] = useState('');
    const [outputCode, setOutputCode] = useState('');
    const [savings, setSavings] = useState(0);
    const [framework, setFramework] = useState<'PyTorch' | 'TensorFlow' | 'Hugging Face' | 'Unknown'>('Unknown');

    // Auto-focus input on mount
    const inputRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleRefine = () => {
        if (!inputCode.trim()) return;

        setStatus('analyzing');
        setOutputCode('');

        // Simulate AI Processing Time
        setTimeout(() => {
            const result = optimizeCode(inputCode);
            setOutputCode(result.optimizedCode);
            setSavings(result.savings);
            setFramework(result.framework);
            setStatus('complete');
        }, 2200);
    };

    return (
        <Card className="border-0 shadow-none bg-transparent h-full flex flex-col">
            <CardHeader className="pb-4 px-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Code2 className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                GreenGen Agent
                                {status === 'idle' && <Badge variant="secondary" className="text-xs">Standby</Badge>}
                                {status === 'analyzing' && <Badge className="bg-purple-500/10 text-purple-500 border-purple-200 animate-pulse text-xs">Analyzing...</Badge>}
                                {status === 'complete' && <Badge className="bg-green-500/10 text-green-600 border-green-200 text-xs">Optimized</Badge>}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">Paste your ML script below to optimize.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {status === 'complete' && (
                            <div className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-500/10 px-3 py-1.5 rounded-full animate-in fade-in slide-in-from-right-4">
                                <Flame className="h-3 w-3" />
                                -{savings}% Energy Est.
                            </div>
                        )}
                        <Button
                            size="sm"
                            onClick={handleRefine}
                            disabled={status === 'analyzing' || !inputCode.trim()}
                            className={cn(
                                "gap-2 transition-all duration-500",
                                status === 'complete' ? "bg-green-600 hover:bg-green-700 w-32" : "bg-purple-600 hover:bg-purple-700 w-28"
                            )}
                        >
                            {status === 'idle' && (
                                <>
                                    <Zap className="h-4 w-4" /> Refine
                                </>
                            )}
                            {status === 'analyzing' && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            {status === 'complete' && (
                                <>
                                    <CheckCircle className="h-4 w-4" /> Done
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0">
                <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0">
                    {/* Input Pane */}
                    <div className="flex flex-col h-full flex-1 min-w-0">
                        <div className="mb-2 text-gray-500 uppercase tracking-widest text-[10px] font-bold flex justify-between">
                            <span>Input Script</span>
                            <span>Paste code here</span>
                        </div>
                        <Textarea
                            ref={inputRef}
                            placeholder={`Example Input:
model = ResNet50()
optimizer = torch.optim.Adam(model.parameters())
output = model(input)
loss = criterion(output, target)
loss.backward()
optimizer.step()`}
                            className="flex-1 font-mono text-xs bg-zinc-950/50 border-border/50 md:min-h-[300px] resize-none text-gray-300"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value)}
                        />
                    </div>

                    {/* Output Pane */}
                    <div className="flex flex-col h-full flex-1 min-w-0 relative">
                        <div className="mb-2 text-green-500 uppercase tracking-widest text-[10px] font-bold flex justify-between">
                            <span>Agent Proposal ({framework})</span>
                            <span>optimized_v1.py</span>
                        </div>

                        <div className="flex-1 bg-zinc-950 border border-border/50 rounded-md p-4 overflow-auto font-mono text-xs relative text-gray-300 md:min-h-[300px]">
                            {status === 'idle' && !outputCode && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                    <MessageSquare className="h-8 w-8 mb-2" />
                                    <p className="text-sm">Ready to examine code.</p>
                                </div>
                            )}

                            {status === 'analyzing' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 gap-3 z-10 backdrop-blur-sm">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-6 bg-purple-500/50 animate-pulse [animation-delay:0ms]" />
                                        <span className="w-1.5 h-10 bg-purple-500/80 animate-pulse [animation-delay:150ms]" />
                                        <span className="w-1.5 h-8 bg-purple-500/50 animate-pulse [animation-delay:300ms]" />
                                    </div>
                                    <p className="text-purple-400 text-xs animate-pulse">Running Static Green Analysis...</p>
                                </div>
                            )}

                            {outputCode && (
                                <pre className="whitespace-pre-wrap leading-relaxed animate-in fade-in duration-700">
                                    {outputCode.split('\n').map((line, i) => (
                                        <div key={i} className={
                                            line.includes('GradScaler') ||
                                                line.includes('autocast') ||
                                                line.includes('scaler') ||
                                                line.includes('jit_compile') ||
                                                line.includes('GreenGen')
                                                ? "bg-green-900/30 text-green-400 w-full" : ""
                                        }>
                                            {line}
                                        </div>
                                    ))}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
